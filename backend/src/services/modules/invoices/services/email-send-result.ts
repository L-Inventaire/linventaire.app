import Framework from "#src/platform/index";
import type { EmailSendResult } from "#src/platform/push-email/api";
import Services from "#src/services/index";
import { Context } from "#src/types";
import Invoices, { InvoicesDefinition } from "../entities/invoices";

/**
 * How long we wait, after firing the emails, before checking their send state.
 * The delay lets the transport report back (SES answers asynchronously). This
 * is a best-effort, in-memory timer: if the server restarts before it fires,
 * the check is simply lost — which we accept for simplicity.
 */
export const EMAIL_SEND_RESULT_CHECK_DELAY_MS = 30_000;

/**
 * Records the outcome of an email send attempt for a document.
 *
 * When at least one recipient was rejected by the mail server it:
 *  - adds an event to the document timeline (and, through `createEvent`, a
 *    notification for the subscribed users), differentiating a TOTAL failure
 *    (no recipient received the document) from a PARTIAL send (some recipients
 *    got it, some were rejected);
 *  - flags the document with a "problème d'envoi" detail on `state_details` so a
 *    tag can be shown on the document itself.
 *
 * When every recipient received the document it clears any previous
 * send-problem flag (the send finally went through).
 */
export const recordEmailSendResult = async (
  ctx: Context,
  invoice: Invoices,
  sentEmails: string[],
  failedEmails: string[]
) => {
  const db = await Framework.Db.getService();

  if (failedEmails.length === 0) {
    // Everything went through: clear a previous send-problem flag if any.
    if (invoice.state_details?.email_status) {
      await db.update<Invoices>(
        ctx,
        InvoicesDefinition.name,
        { id: invoice.id, client_id: invoice.client_id },
        { state_details: { email_status: "", email_failed_recipients: [] } }
      );
    }
    return;
  }

  const partial = sentEmails.length > 0;

  // Timeline event + notification (createEvent fans out to notifyUsers because
  // the metadata carries an event_type).
  await Services.Comments.createEvent(ctx, {
    client_id: invoice.client_id,
    item_entity: "invoices",
    item_id: invoice.id,
    type: "event",
    content: `Email delivery ${
      partial ? "partially failed" : "failed"
    } for ${failedEmails.join(", ")}`,
    metadata: {
      event_type: "smtp_failed",
      emails: failedEmails,
      partial,
      sent_emails: sentEmails,
    },
    documents: [],
    reactions: [],
  });

  // Flag the document so a "problème d'envoi" tag can be displayed.
  await db.update<Invoices>(
    ctx,
    InvoicesDefinition.name,
    { id: invoice.id, client_id: invoice.client_id },
    {
      state_details: {
        email_status: partial ? "partial" : "failed",
        email_failed_recipients: failedEmails,
      },
    }
  );
};

/**
 * Schedules a deferred check of the email send outcome.
 *
 * The emails are fired without blocking the request; `deliveries` is a shared
 * map that the transport fills in asynchronously (keyed by recipient email).
 * After `delayMs` we look at what came back and record the outcome through
 * `recordEmailSendResult` (timeline event + notification + document flag for
 * the recipients that were rejected).
 *
 * Recipients with no reported result by the deadline are treated as sent — we
 * only ever flag a *confirmed* rejection. The timer is unref'd so it never
 * keeps the process alive on its own; if the server restarts first, the check
 * is lost (accepted trade-off for keeping this simple).
 */
export const scheduleEmailSendResultCheck = (
  ctx: Context,
  invoice: Invoices,
  recipients: { email: string }[],
  deliveries: Record<string, EmailSendResult>,
  delayMs: number = EMAIL_SEND_RESULT_CHECK_DELAY_MS
) => {
  const timer = setTimeout(async () => {
    try {
      const failedEmails = recipients
        .map((r) => r.email)
        .filter((email) => deliveries[email]?.success === false);
      const sentEmails = recipients
        .map((r) => r.email)
        .filter((email) => !failedEmails.includes(email));

      await recordEmailSendResult(ctx, invoice, sentEmails, failedEmails);
    } catch (e) {
      Framework.LoggerDb.get("email-send-result").error(ctx, e as any);
    }
  }, delayMs);

  timer.unref?.();

  return timer;
};
