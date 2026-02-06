import { Express, Router } from "express";
import config from "config";
import { default as Framework, default as platform } from "../../../platform";
import { Logger } from "../../../platform/logger-db";
import { InternalApplicationService } from "../../types";
import DocumensoAdapter from "./adapters/documenso/documenso";
import InternalAdapter from "./adapters/internal/internal";
import createInternalRoutes from "./adapters/internal/routes";

import {
  SigningSessions,
  SigningSessionsDefinition,
} from "./entities/signing-session";
import { DocumentSignerInterface } from "./interface";
import registerRoutes from "./routes";
import {
  expireOtherSigningSessions,
  generateEmailMessageToRecipient,
} from "./services/utils";
import { generatePdf } from "../invoices/services/generate-pdf";
import Invoices, {
  InvoicesDefinition,
  Recipient,
} from "../invoices/entities/invoices";
import { createSigningSession } from "./services/create";
import { Context } from "#src/types";
import Clients, {
  ClientsDefinition,
} from "#src/services/clients/entities/clients";

export default class SigningSessionService
  implements InternalApplicationService
{
  version = 1;
  name = "signing-sessions";
  private logger: Logger;
  public documentSigner: DocumentSignerInterface;

  async init(server: Express) {
    const router = Router();
    registerRoutes(router);

    server.use(`/api/${this.name}/v${this.version}`, router);

    const db = await platform.Db.getService();
    await db.createTable(SigningSessionsDefinition);

    this.logger = Framework.LoggerDb.get("signing-sessions");

    // Choose adapter based on configuration
    const adapterType = config.has("signature.adapter")
      ? config.get<string>("signature.adapter")
      : "documenso";

    if (adapterType === "internal") {
      this.logger.info(null, "Using internal signing adapter");
      const internalAdapter = new InternalAdapter();
      await internalAdapter.init();
      this.documentSigner = internalAdapter;

      // Register internal adapter routes
      // Only register if we want to expose these routes, otherwise we can call the adapter methods directly from the service
      // const internalRouter = createInternalRoutes(internalAdapter);
      // server.use(`/api/${this.name}/internal`, internalRouter);
    } else {
      this.logger.info(null, "Using Documenso adapter");
      this.documentSigner = new DocumensoAdapter();
    }

    Framework.TriggersManager.registerEntities([SigningSessionsDefinition], {
      READ: "SIGNING_SESSIONS_READ",
      WRITE: "SIGNING_SESSIONS_WRITE",
      MANAGE: "SIGNING_SESSIONS_MANAGE",
    });

    // setOnSigningSessionSignedTrigger();
    // setOnSigningSessionCancelledTrigger();

    console.log(`${this.name}:v${this.version} initialized`);

    return this;
  }

  async hasSigningSessions(ctx: Context, invoiceId: string) {
    const db = await platform.Db.getService();
    const count = await db.count<SigningSessions>(
      ctx,
      SigningSessionsDefinition.name,
      {
        invoice_id: invoiceId,
      }
    );

    return count > 0;
  }

  async downloadSignedDocument(ctx: Context, invoiceId: string) {
    const db = await platform.Db.getService();
    const invoice = await db.selectOne<Invoices>(
      ctx,
      InvoicesDefinition.name,
      { id: invoiceId },
      {}
    );

    if (!invoice) throw new Error("Invoice not found");
    const signingSession = await db.selectOne<SigningSessions>(
      ctx,
      SigningSessionsDefinition.name,
      {
        invoice_id: invoiceId,
        state: "signed",
      }
    );

    if (!signingSession) throw new Error("No signed document found");

    const document = await this.documentSigner.downloadSignedDocument(
      signingSession.external_id
    );

    return document;
  }

  async createSigningSessions(
    ctx: Context,
    invoiceID: string,
    recipients: Recipient[],
    reuseExistingSession = false
  ) {
    const db = await platform.Db.getService();
    const invoice = await db.selectOne<Invoices>(
      ctx,
      InvoicesDefinition.name,
      { id: invoiceID },
      {}
    );

    if (!invoice) throw new Error("Invoice not found");

    const resultingSigningSessions: SigningSessions[] = [];

    for (const recipient of recipients) {
      if (!recipient) throw new Error("Recipient is wrong");

      const existingSession = reuseExistingSession
        ? await db.selectOne<SigningSessions>(
            ctx,
            SigningSessionsDefinition.name,
            {
              invoice_id: invoiceID,
              recipient_email: recipient.email,
              state: ["created", "viewed", "sent", "signed"],
            }
          )
        : null;

      // Create a signing session
      const createdSigningSession = await createSigningSession(ctx, {
        recipient: recipient,
        invoice,
      });
      const signingSession = existingSession ?? createdSigningSession;
      resultingSigningSessions.push(signingSession);

      // Send email to recipient
      const { message, subject, htmlLogo } =
        await generateEmailMessageToRecipient(ctx, "sent", invoice, recipient, {
          signingSession,
        });

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

    // If we are sending the invoice again, we must expire other sessions
    if (resultingSigningSessions.length > 0) {
      await expireOtherSigningSessions(ctx, resultingSigningSessions);
    }

    return resultingSigningSessions;
  }
}
