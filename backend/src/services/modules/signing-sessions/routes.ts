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

    const mappedDocument = {
      ...signingSession,
      currentInvoice: currentInvoice,
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

    const lines = options.map((line, index) => ({
      index,
      value: [line.article, line.quantity, line.unit_price],
    }));

    // Update the invoice with the optional lines selected by the signer
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

    const recipients = (signingSession.invoice_snapshot as unknown as Invoices)
      .recipients;
    const invoice = signingSession.invoice_snapshot as unknown as Invoices;

    for (const recipient of recipients) {
      // Send email to recipient
      const { message, subject, htmlLogo } =
        await generateEmailMessageToRecipient(
          ctx,
          "signed",
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

    await expireOtherSigningSessions(ctx, [signingSession]);

    // Insérer l'événement dans la timeline
    await Services.Comments.createEvent(ctx, {
      client_id: invoice.client_id,
      item_entity: "invoices",
      item_id: invoice.id,
      type: "event",
      content: `Document signed by ${signingSession.recipient_email}`,
      metadata: {
        email: signingSession.recipient_email,
        event_type: "quote_signed",
        session_id: signingSession.id,
      },
      documents: [],
      reactions: [],
    });

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
};
