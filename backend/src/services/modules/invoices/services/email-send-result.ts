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
 * Optimistically flags a document as "sent" (blue indicator) right after an
 * email is dispatched — before we know whether it was delivered. Never
 * downgrades a "received" confirmation that may already be set.
 */
export const markEmailSent = async (ctx: Context, invoice: Invoices) => {
  if (invoice.state_details?.email_status === "received") return;

  const db = await Framework.Db.getService();
  await db.update<Invoices>(
    ctx,
    InvoicesDefinition.name,
    { id: invoice.id, client_id: invoice.client_id },
    { state_details: { email_status: "sent", email_failed_recipients: [] } }
  );
};

/**
 * Flags a document as "received" (green indicator): a mail client fetched the
 * tracking pixel, or the recipient opened the signing link. Both prove the
 * message reached the recipient's mailbox (Apple MPP only pre-fetches delivered
 * messages) — not that a human opened it.
 *
 * Resolves the document by id (called from public/untenanted endpoints) and
 * never overrides a confirmed send failure, which stays actionable.
 */
export const markEmailReceived = async (ctx: Context, invoiceId: string) => {
  const db = await Framework.Db.getService();

  const invoice = await db.selectOne<Invoices>(
    { ...ctx, role: "SYSTEM" },
    InvoicesDefinition.name,
    { id: invoiceId }
  );
  if (!invoice) return;

  const status = invoice.state_details?.email_status;
  if (status === "received" || status === "failed" || status === "partial") {
    return;
  }

  await db.update<Invoices>(
    { ...ctx, client_id: invoice.client_id, role: "SYSTEM" },
    InvoicesDefinition.name,
    { id: invoice.id, client_id: invoice.client_id },
    { state_details: { email_status: "received", email_failed_recipients: [] } }
  );
};

/**
 * Records the outcome of an email send attempt for a document.
 *
 * Success is handled elsewhere — optimistically by `markEmailSent` at send
 * time, then confirmed by `markEmailReceived` (tracking pixel / signing view) —
 * so this function only has to flag a CONFIRMED rejection: it adds a timeline
 * event (and, through `createEvent`, a notification for subscribed users),
 * differentiating a TOTAL failure (no recipient received the document) from a
 * PARTIAL send, and flags the document via `state_details` so the red indicator
 * can be shown.
 */
export const recordEmailSendResult = async (
  ctx: Context,
  invoice: Invoices,
  sentEmails: string[],
  failedEmails: string[]
) => {
  if (failedEmails.length === 0) return;

  const db = await Framework.Db.getService();
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
