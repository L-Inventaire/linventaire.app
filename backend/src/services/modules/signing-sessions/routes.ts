import platform from "#src/platform/index";
import Services from "#src/services/index";
import { Ctx } from "#src/services/utils";
import config from "config";
import { Router } from "express";
import { checkRole } from "../../common";
import Invoices, {
  InvoiceLine,
  InvoicesDefinition,
} from "../invoices/entities/invoices";

import Clients, {
  ClientsDefinition,
} from "#src/services/clients/entities/clients";
import _ from "lodash";
import { generatePdf } from "../invoices/services/generate-pdf";
import {
  SigningSessions,
  SigningSessionsDefinition,
} from "./entities/signing-session";
import { updateSigningSession } from "./services/create";
import { uploadDocumentToSigningSession } from "./services/upload";
import {
  cancelSigningSessions,
  expireOtherSigningSessions,
  generateEmailMessageToRecipient,
} from "./services/utils";

/**
 * Save optional lines selected by user to the invoice
 */
async function saveInvoiceOptions(ctx: any, invoice: Invoices, options: any[]) {
  if (!options || options.length === 0) return;

  const db = await platform.Db.getService();
  const lines = options.map((line: any, index: number) => ({
    index,
    value: [line.article, line.quantity, line.unit_price],
  }));

  invoice.content = invoice.content.map<InvoiceLine>((line) => {
    const foundLine = lines.find((l) =>
      _.isEqual(l.value, [line.article, line.quantity, line.unit_price])
    );

    if (foundLine) {
      const realLine = options[foundLine.index];
      return {
        ...line,
        optional: realLine.optional,
        optional_checked: realLine.optional_checked,
      };
    }

    return line;
  });

  await db.update<Invoices>(
    ctx,
    InvoicesDefinition.name,
    { id: invoice.id },
    invoice
  );
}

/**
 * Send confirmation emails to recipients after signing
 */
async function sendSigningConfirmationEmails(
  ctx: any,
  invoice: Invoices,
  signingSession: SigningSessions
) {
  const db = await platform.Db.getService();
  const recipients = invoice.recipients || [];

  for (const recipient of recipients) {
    const { message, subject, htmlLogo } =
      await generateEmailMessageToRecipient(ctx, "signed", invoice, recipient, {
        signingSession,
      });

    const { name, pdf } = await generatePdf(
      { ...ctx, client_id: invoice.client_id },
      invoice
    );

    const client = await db.selectOne<Clients>(ctx, ClientsDefinition.name, {
      id: invoice.client_id,
    });

    await platform.PushEMail.push(
      ctx,
      recipient.email,
      message,
      {
        from: client?.company?.name || client?.company?.legal_name,
        subject: subject,
        attachments: [{ filename: name, content: pdf }],
        logo: htmlLogo,
      },
      client.smtp
    );
  }
}

/**
 * Create timeline event for document signing
 */
async function createSigningTimelineEvent(
  ctx: any,
  invoice: Invoices,
  signingSession: SigningSessions
) {
  await Services.Comments.createEvent(ctx, {
    client_id: invoice.client_id,
    item_entity: "invoices",
    item_id: invoice.id,
    type: "event",
    content: `Signed by ${signingSession.recipient_email}`,
    metadata: {
      event_type: "quote_signed",
      email: signingSession.recipient_email,
      session_id: signingSession.id,
    },
    documents: [],
    reactions: [],
  });
}

export default (router: Router) => {
  router.post(
    "/:clientId/send-invoice/:id",
    checkRole("USER"),
    async (req, res) => {
      const ctx = Ctx.get(req)?.context;
      if (!req.body.recipients) throw new Error("Recipients are required");

      const newSigningSessions =
        await Services.SignatureSessions.createSigningSessions(
          ctx,
          req.params.id,
          req.body.recipients,
          false
        );

      const db = await platform.Db.getService();
      const invoice = await db.selectOne<Invoices>(
        ctx,
        InvoicesDefinition.name,
        {
          id: req.params.id,
        }
      );

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      // Insérer l'événement dans la timeline
      await Services.Comments.createEvent(ctx, {
        client_id: invoice.client_id,
        item_entity: "invoices",
        item_id: invoice.id,
        type: "event",
        content: `Sent to ${req.body.recipients
          .map((rec) => rec.email)
          .join(", ")}`,
        metadata: {
          event_type:
            invoice?.type === "quotes" ? "quote_sent" : "invoice_sent",
          recipients: req.body.recipients,
        },
        documents: [],
        reactions: [],
      });

      res.json(newSigningSessions);
    }
  );

  router.get("/:id", async (req, res) => {
    const db = await platform.Db.getService();
    const ctx = Ctx.get(req)?.context;

    const signingSession = await db.selectOne<SigningSessions>(
      ctx,
      SigningSessionsDefinition.name,
      { id: req.params.id },
      {}
    );

    const currentInvoice = await db.selectOne<Invoices>(
      ctx,
      InvoicesDefinition.name,
      { id: signingSession.invoice_id },
      {}
    );

    // Check if using internal signing mode
    const adapterType = config.has("signature.adapter")
      ? config.get<string>("signature.adapter")
      : "documenso";

    const mappedDocument = {
      ...signingSession,
      currentInvoice: currentInvoice,
      linventaire_signature: adapterType === "internal",
    };

    res.json(mappedDocument);
  });

  /**
   * Generates a signing session for the given invoice, returns the signing URL
   */
  router.post("/:id/sign", async (req, res) => {
    const ctx = Ctx.get(req)?.context;
    const db = await platform.Db.getService();

    let signingSession = await db.selectOne<SigningSessions>(
      ctx,
      SigningSessionsDefinition.name,
      { id: req.params.id },
      {}
    );

    if (!signingSession) {
      throw new Error("Signing session not found");
    }

    if (signingSession.expired === true) {
      throw new Error("Signing session is expired");
    }

    if (signingSession.recipient_role !== "signer") {
      throw new Error("Recipient is not a signer");
    }

    if (signingSession.state === "sent" || signingSession.state === "signed") {
      return res.json(signingSession);
    }

    const invoice = signingSession.invoice_snapshot as unknown as Invoices;

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    if (invoice.type === "invoices") {
      throw new Error("Cannot sign invoice");
    }

    const options = req.body.options;

    // Prepare document to sign, but the signing session is not started yet
    const documentToSign =
      await Services.SignatureSessions.documentSigner.addDocumentToSign({
        signingSessionId: signingSession.id,
        title: invoice.reference,
        reference: signingSession.id,
        recipients: [
          {
            name: "Signer",
            email: signingSession.recipient_email,
          },
        ],
        subject: "",
        message: "",
        redirectUrl: config
          .get<string>("signature.webhook.signed")
          .replace(":signing-session", signingSession.id),
      });

    // Upload the PDF spapshot of the invoice to the document signer
    signingSession = await updateSigningSession(ctx, {
      ...signingSession,
      external_id: documentToSign.id,
      upload_url: documentToSign.uploadUrl,
      recipient_token: documentToSign.recipients[0].token,
    });
    await uploadDocumentToSigningSession(ctx, signingSession, options);

    // Add the signature field to the document
    const { positions } = await generatePdf(
      { ...ctx, client_id: invoice.client_id },
      signingSession.invoice_snapshot as unknown as Invoices
    );
    const document =
      await Services.SignatureSessions.documentSigner.getSigningSession(
        documentToSign.id
      );

    await Services.SignatureSessions.documentSigner.addField({
      document,
      position: positions.find((p) => p.label === "SIGNATURE"),
    });

    // Start the signing session
    await Services.SignatureSessions.documentSigner.sendToSign({
      documentID: documentToSign.id,
      sendEmail: false,
    });

    // Update the signing session with the signing URL
    signingSession = await updateSigningSession(ctx, {
      ...signingSession,
      signing_url: documentToSign.signingUrl,
      state: "sent",
    });

    // Save optional lines selected by the signer
    await saveInvoiceOptions(ctx, invoice, options);

    res.json(signingSession);
  });

  router.post("/:id/view", async (req, res) => {
    const ctx = Ctx.get(req)?.context;
    const db = await platform.Db.getService();

    const signingSession = await db.selectOne<SigningSessions>(
      ctx,
      SigningSessionsDefinition.name,
      { id: req.params.id },
      {}
    );

    if (!signingSession) {
      throw new Error("Signing session not found");
    }

    if (signingSession.expired === true) {
      throw new Error("Signing session is expired");
    }

    // No need to view if already viewed or signed
    if (
      signingSession.state === "viewed" ||
      signingSession.state === "signed" ||
      signingSession.state === "cancelled"
    ) {
      return res.json(signingSession);
    }

    updateSigningSession(ctx, {
      ...signingSession,
      state: "viewed",
    });

    res.json(signingSession);
  });

  router.post("/:id/confirm-signed", async (req, res) => {
    const ctx = Ctx.get(req)?.context;
    const db = await platform.Db.getService();

    const signingSession = await db.selectOne<SigningSessions>(
      ctx,
      SigningSessionsDefinition.name,
      { id: req.params.id },
      {}
    );

    if (!signingSession) {
      throw new Error("Signing session not found");
    }

    if (signingSession.expired === true) {
      throw new Error("Signing session is expired");
    }

    // No need to sign if already completed or cancelled
    if (
      signingSession.state === "signed" ||
      signingSession.state === "cancelled"
    ) {
      return res.json(signingSession);
    }

    // TODO we should check if all recipients have signed

    await updateSigningSession(ctx, {
      ...signingSession,
      state: "signed",
    });

    const invoice = signingSession.invoice_snapshot as unknown as Invoices;

    // Send confirmation emails
    await sendSigningConfirmationEmails(ctx, invoice, signingSession);

    await expireOtherSigningSessions(ctx, [signingSession]);

    // Create timeline event
    await createSigningTimelineEvent(ctx, invoice, signingSession);

    res.json(signingSession);
  });

  router.post("/:id/cancel", async (req, res) => {
    const ctx = Ctx.get(req)?.context;
    const db = await platform.Db.getService();

    const signingSession = await db.selectOne<SigningSessions>(
      ctx,
      SigningSessionsDefinition.name,
      { id: req.params.id },
      {}
    );

    if (!signingSession) {
      throw new Error("Signing session not found");
    }

    if (signingSession.expired === true) {
      throw new Error("Signing session is expired");
    }

    // No need to cancel if already signed or cancelled
    if (
      signingSession.state === "signed" ||
      signingSession.state === "cancelled"
    ) {
      return res.json(signingSession);
    }

    const invoice = signingSession.invoice_snapshot as unknown as Invoices;

    if (!(invoice?.type === "quotes" || invoice?.type === "credit_notes")) {
      return res.json(signingSession);
    }

    await cancelSigningSessions(ctx, invoice);

    const recipients = (signingSession.invoice_snapshot as unknown as Invoices)
      .recipients;

    for (const recipient of recipients) {
      // Send email to recipient
      const { message, subject, htmlLogo } =
        await generateEmailMessageToRecipient(
          ctx,
          "cancelled",
          invoice,
          recipient,
          { signingSession }
        );

      const { name, pdf } = await generatePdf(
        { ...ctx, client_id: invoice?.client_id },
        invoice
      );

      const client = await db.selectOne<Clients>(ctx, ClientsDefinition.name, {
        id: invoice.client_id,
      });

      await platform.PushEMail.push(
        ctx,
        recipient.email,
        message,
        {
          from: client?.company?.name || client?.company?.legal_name,
          subject: subject,
          attachments: [{ filename: name, content: pdf }],
          logo: htmlLogo,
        },
        client.smtp
      );
    }

    // Insérer l'événement dans la timeline
    await Services.Comments.createEvent(ctx, {
      client_id: invoice.client_id,
      item_entity: "invoices",
      item_id: invoice.id,
      type: "event",
      content: `Document signature cancelled by ${signingSession.recipient_email}`,
      metadata: {
        email: signingSession.recipient_email,
        event_type: "quote_refused",
        reason: signingSession.reason,
      },
      documents: [],
      reactions: [],
    });

    res.json(signingSession);
  });

  router.get("/:id/download", async (req, res) => {
    const ctx = Ctx.get(req)?.context;
    const db = await platform.Db.getService();
    const signingSession = await db.selectOne<SigningSessions>(
      ctx,
      SigningSessionsDefinition.name,
      { id: req.params.id },
      {}
    );

    if (!signingSession) {
      throw new Error("Signing session not found");
    }

    if (signingSession.expired === true) {
      throw new Error("Signing session is expired");
    }

    if (signingSession.state !== "signed") {
      throw new Error("Document not signed yet");
    }

    if (!signingSession.external_id) {
      throw new Error("External ID not found");
    }

    try {
      const signedDocumentBuffer =
        await Services.SignatureSessions.documentSigner.downloadSignedDocument(
          signingSession.external_id
        );

      if (signedDocumentBuffer) {
        res.type("pdf");
        res.send(signedDocumentBuffer);
      } else {
        res.status(404).send("Document not ready or not found");
      }
    } catch (e) {
      res.status(404).send("Can't download signed document: " + e.message);
    }
  });

  /**
   * Request verification code for internal signing
   * POST /:id/request-verification
   */
  router.post("/:id/request-verification", async (req, res) => {
    const ctx = Ctx.get(req)?.context;
    const db = await platform.Db.getService();

    // Check if using internal adapter
    const adapterType = config.has("signature.adapter")
      ? config.get<string>("signature.adapter")
      : "documenso";

    if (adapterType !== "internal") {
      return res.status(400).json({ error: "Internal signing not enabled" });
    }

    const signingSession = await db.selectOne<SigningSessions>(
      ctx,
      SigningSessionsDefinition.name,
      { id: req.params.id },
      {}
    );

    if (!signingSession) {
      return res.status(404).json({ error: "Signing session not found" });
    }

    if (signingSession.expired === true) {
      return res.status(400).json({ error: "Signing session is expired" });
    }

    if (signingSession.state === "signed") {
      return res.status(400).json({ error: "Document already signed" });
    }

    try {
      // Generate and send verification code
      const InternalAdapter = (await import("./adapters/internal/internal"))
        .default;
      const adapter = Services.SignatureSessions.documentSigner as InstanceType<
        typeof InternalAdapter
      >;

      // First ensure the e_sign_session exists
      const documentToSign = await adapter.addDocumentToSign({
        signingSessionId: signingSession.id,
        title: (signingSession.invoice_snapshot as any).reference || "Document",
        reference: signingSession.id,
        recipients: [
          {
            name: "Signer",
            email: signingSession.recipient_email,
          },
        ],
        subject: "",
        message: "",
        redirectUrl: "",
      });

      // Get the e_sign_session by signing_session_id and request code
      const eSignSession = await adapter.getSigningSessionBySigningSessionId(
        signingSession.id
      );
      if (eSignSession) {
        await adapter.requestVerificationCode(ctx, eSignSession.token);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Request verification error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Verify code and sign document for internal signing
   * POST /:id/verify-and-sign
   */
  router.post("/:id/verify-and-sign", async (req, res) => {
    const ctx = Ctx.get(req)?.context;
    const db = await platform.Db.getService();

    // Check if using internal adapter
    const adapterType = config.has("signature.adapter")
      ? config.get<string>("signature.adapter")
      : "documenso";

    if (adapterType !== "internal") {
      return res.status(400).json({ error: "Internal signing not enabled" });
    }

    const { code, signatureBase64, options, metadata } = req.body;

    if (!code || !signatureBase64) {
      return res.status(400).json({ error: "Code and signature required" });
    }

    const signingSession = await db.selectOne<SigningSessions>(
      ctx,
      SigningSessionsDefinition.name,
      { id: req.params.id },
      {}
    );

    if (!signingSession) {
      return res.status(404).json({ error: "Signing session not found" });
    }

    if (signingSession.expired === true) {
      return res.status(400).json({ error: "Signing session is expired" });
    }

    if (signingSession.state === "signed") {
      return res.status(400).json({ error: "Document already signed" });
    }

    try {
      const InternalAdapter = (await import("./adapters/internal/internal"))
        .default;
      const adapter = Services.SignatureSessions.documentSigner as InstanceType<
        typeof InternalAdapter
      >;

      // Get the e_sign_session
      const eSignSession = await adapter.getSigningSessionBySigningSessionId(
        signingSession.id
      );
      if (!eSignSession) {
        return res.status(404).json({ error: "Internal session not found" });
      }

      // Verify the code
      const isValid = await adapter.verifyCode(eSignSession.token, code);
      if (!isValid) {
        return res.status(400).json({ error: "Code invalide ou expiré" });
      }

      // Upload the PDF if not already uploaded and extract signature position
      if (!eSignSession.document_pdf) {
        const invoice = signingSession.invoice_snapshot as unknown as Invoices;
        const { pdf, positions } = await generatePdf(
          { ...ctx, client_id: invoice.client_id },
          invoice,
          {
            checkedIndexes: options
              ? Object.fromEntries(
                  options.map((o: any, index: number) => [
                    index.toString(),
                    o.optional_checked,
                  ])
                )
              : undefined,
          }
        );
        await adapter.uploadDocument(eSignSession.document_id, pdf);

        // Set signature position from PDF parsing
        const signaturePosition = positions.find(
          (p) => p.label === "SIGNATURE"
        );
        if (signaturePosition) {
          const document = await adapter.getSigningSession(
            eSignSession.document_id
          );
          await adapter.addField({
            document,
            position: signaturePosition,
          });
        }
      }

      // Sign the document
      await adapter.signDocument(eSignSession.token, signatureBase64, metadata);

      // Save optional lines selected by the signer BEFORE marking as signed
      const invoice = signingSession.invoice_snapshot as unknown as Invoices;
      await saveInvoiceOptions(ctx, invoice, options);

      // Update the signing session state (this will trigger onSigningSessionSigned)
      await updateSigningSession(ctx, {
        ...signingSession,
        state: "signed",
        external_id: eSignSession.document_id,
      });

      // Send confirmation emails
      await sendSigningConfirmationEmails(ctx, invoice, signingSession);

      // Create timeline event
      await createSigningTimelineEvent(ctx, invoice, signingSession);

      res.json({ success: true });
    } catch (error) {
      console.error("Verify and sign error:", error);
      res.status(500).json({ error: error.message });
    }
  });
};
