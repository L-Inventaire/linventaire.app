import Framework from "#src/platform/index";
import Services from "#src/services/index";
import { Context } from "#src/types";
import Invoices, { InvoicesDefinition } from "../entities/invoices";

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
