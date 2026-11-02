import Framework from "#src/platform/index";
import Services from "#src/services/index";
import Contacts, {
  ContactsDefinition,
} from "../../contacts/entities/contacts";
import Invoices, { InvoicesDefinition } from "../entities/invoices";
import {
  getEInvoiceSkipReason,
  queueEInvoice,
  sendEInvoice,
  skipEInvoice,
} from "../services/send-e-invoice";

/**
 * When an invoice or credit note leaves the draft state (sent, closed...),
 * transmit it to the e-invoicing platform if sending is enabled in the
 * e-invoicing settings ("Envoi automatique des factures").
 *
 * - Documents not concerned (customer abroad, private individual) are only
 *   flagged "skipped", they are never blocked.
 * - Blocking mode ("Bloquer en cas d'échec"): the transmission runs now, inside
 *   the transaction, and a failure refuses the state change (rollback).
 * - Otherwise (default): the transmission is queued and runs right after, a
 *   failure is only recorded on the document and in its timeline.
 */
export const setOnSentEInvoiceTrigger = () =>
  Framework.TriggersManager.registerTrigger<Invoices>(InvoicesDefinition, {
    test: (ctx, entity, prev) =>
      // Imported documents were already transmitted (or never will be)
      !ctx?.import &&
      !!entity &&
      ["invoices", "credit_notes"].includes(entity.type) &&
      !["draft", "recurring"].includes(entity.state) &&
      (!prev || prev.state === "draft") &&
      !["uploaded", "pending", "sending"].includes(
        entity.e_invoice?.status || ""
      ),
    callback: async (ctx, entity) => {
      if (!entity) return;

      const config = await Services.EInvoices.getConfig(ctx);
      if (config?.connection_status !== "connected" || !config.send_enabled)
        return;

      const db = await Framework.Db.getService();
      const customer = entity.client
        ? await db.selectOne<Contacts>(ctx, ContactsDefinition.name, {
            client_id: entity.client_id,
            id: entity.client,
          })
        : null;
      const skipReason = getEInvoiceSkipReason(customer);
      if (skipReason) {
        await skipEInvoice(ctx, entity, skipReason);
        return;
      }

      if (config.send_blocking) {
        await sendEInvoice(ctx, entity, { throwOnError: true });
      } else {
        await queueEInvoice(ctx, entity);
      }
    },
    name: "on-sent-e-invoice",
    // After the other triggers (en16931 computed, nothing left to roll back
    // once the e-invoice is transmitted in blocking mode)
    priority: 900,
  });
