import { default as Framework, default as platform } from "#src/platform/index";
import Clients, {
  ClientsDefinition,
} from "#src/services/clients/entities/clients";
import { Context } from "#src/types";
import config from "config";
import _ from "lodash";
import Invoices, { Recipient } from "../../invoices/entities/invoices";
import { getInvoiceLogoHtml } from "../../invoices/utils";
import {
  SigningSessions,
  SigningSessionsDefinition,
} from "../entities/signing-session";
import { createSigningSession, updateSigningSession } from "./create";

export const generateEmailMessageToRecipient = async (
  ctx: Context,
  action = "sent" as "sent" | "signed" | "purchase_order" | "cancelled",
  invoice: Invoices,
  recipient: Recipient,
  options: {
    as?: "proforma" | "receipt_acknowledgement" | "delivery_slip";
    signingSession?: SigningSessions;
  } = {}
) => {
  const signingSession =
    options.signingSession ||
    (await createSigningSession(ctx, {
      recipient: { email: recipient.email, role: "viewer" },
      invoice,
    })); // It makes a default reading link
  const as = options.as;
  let messagePath: string | string[] = [];
  let subjectPath: string | string[] = [];
  let buttonHref = undefined;

  const db = await Framework.Db.getService();
  const client = await db.selectOne<Clients>(ctx, ClientsDefinition.name, {
    id: invoice.client_id,
  });

  if (as) {
    messagePath = [
      `emails.invoices.as.${as}.${action}.message`,
      `emails.invoices.as.${as}.default.message`,
    ];
    subjectPath = [
      `emails.invoices.as.${as}.${action}.subject`,
      `emails.invoices.as.${as}.default.message`,
    ];
  } else {
    if (
      recipient.role === "signer" &&
      invoice.type === "quotes" &&
      invoice.state !== "draft"
    ) {
      messagePath = `emails.invoices.${invoice.type}.${action}.message`;
      subjectPath = `emails.invoices.${invoice.type}.${action}.subject`;
    } else {
      messagePath = [
        `emails.invoices.${invoice.type}.${action}.message_no_signature`,
        `emails.invoices.${invoice.type}.${action}.message`,
      ];
      subjectPath = [
        `emails.invoices.${invoice.type}.${action}.subject_no_signature`,
        `emails.invoices.${invoice.type}.${action}.subject`,
      ];
    }
  }

  if (signingSession && action === "sent") {
    // TODO make me use config(server.domain) instead of signature webhook stuff
    buttonHref = config
      .get<string>("signature.webhook.to-sign")
      .replace(":signing-session", signingSession?.id);
  }

  if (signingSession && action === "signed") {
    // TODO make me use config(server.domain) instead of signature webhook stuff
    buttonHref = config
      .get<string>("signature.webhook.signed")
      .replace(":signing-session", signingSession.id);
  }

  let htmlLogo = "";
  if (client.invoices?.logo) {
    htmlLogo = await getInvoiceLogoHtml(ctx, client.invoices?.logo);
  }

  let message = platform.I18n.t(ctx, messagePath, {
    replacements: {
      company:
        client?.company?.name || client?.company?.legal_name || "L'inventaire",
      val: invoice.reference,
      href: buttonHref,
    },
  });

  message = platform.I18n.t(ctx, ["emails.invoices.common", "{{body}}"], {
    replacements: {
      body: message,
      footer: client?.preferences?.email_footer,
      company:
        client?.company?.name || client?.company?.legal_name || "L'inventaire",
    },
  });

  const subject = platform.I18n.t(ctx, subjectPath, {
    replacements: {
      company:
        client?.company?.name || client?.company?.legal_name || "L'inventaire",
      val: invoice.reference,
    },
  });

  return { message, subject, htmlLogo };
};

export const expireOtherSigningSessions = async (
  ctx: Context,
  signingSessions: SigningSessions[]
) => {
  const db = await platform.Db.getService();
  const signingSession = _.first(signingSessions);
  const invoiceSigningSessions = await db.select<SigningSessions>(
    ctx,
    SigningSessionsDefinition.name,
    { invoice_id: signingSession.invoice_id },
    {}
  );
  const signingSessionsToExpire = (invoiceSigningSessions || []).filter(
    (sess) =>
      !signingSessions.map((excludedSess) => excludedSess.id).includes(sess.id)
  );

  for (const session of signingSessionsToExpire) {
    await updateSigningSession(ctx, {
      ...session,
      expired: true,
    });
  }
};

export const cancelSigningSessions = async (
  ctx: Context,
  invoice: Invoices
) => {
  const db = await platform.Db.getService();
  const invoiceSigningSessions = await db.select<SigningSessions>(
    ctx,
    SigningSessionsDefinition.name,
    { invoice_id: invoice.id },
    {}
  );

  const signingSessionsToCancel = (invoiceSigningSessions || []).filter(
    (sess) => !sess.expired && sess.state !== "signed"
  );

  for (const session of signingSessionsToCancel) {
    await updateSigningSession(ctx, {
      ...session,
      state: "cancelled",
    });
  }
};
