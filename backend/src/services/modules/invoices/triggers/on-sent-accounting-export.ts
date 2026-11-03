import Framework from "#src/platform/index";
import Invoices, { InvoicesDefinition } from "../entities/invoices";
import {
  getAccountingExportSide,
  queueAccountingEmailExport,
} from "../services/accounting-email-export";

/**
 * When an invoice or credit note leaves the draft state (sales: sent,
 * purchases: booked with "Comptabiliser"), queue its copy to the accountant
 * if an address is set in "Paramètres › Comptabilité".
 */
export const setOnSentAccountingExportTrigger = () =>
  Framework.TriggersManager.registerTrigger<Invoices>(InvoicesDefinition, {
    test: (ctx, entity, prev) =>
      // Imported documents were already handled by the previous software
      !ctx?.import &&
      !!entity &&
      !!getAccountingExportSide(entity) &&
      !["draft", "recurring"].includes(entity.state) &&
      (!prev || prev.state === "draft"),
    callback: async (ctx, entity) => {
      if (!entity) return;
      await queueAccountingEmailExport(ctx, entity);
    },
    name: "on-sent-accounting-export",
    // After the other triggers, like on-sent-e-invoice
    priority: 900,
  });
