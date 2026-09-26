import Framework from "#src/platform/index";
import Services from "#src/services/index";
import Invoices, { InvoicesDefinition } from "../entities/invoices";
import { sendEInvoice } from "../services/send-e-invoice";

/**
 * When an invoice or credit note leaves the draft state (sent, closed...),
 * transmit it to the e-invoicing platform if the client is connected to it.
 *
 * Non blocking: the transmission runs in the background and never fails the
 * document update, errors are recorded on the document (see sendEInvoice).
 */
export const setOnSentEInvoiceTrigger = () =>
  Framework.TriggersManager.registerTrigger<Invoices>(InvoicesDefinition, {
    test: (_ctx, entity, prev) =>
      !!entity &&
      ["invoices", "credit_notes"].includes(entity.type) &&
      !["draft", "recurring"].includes(entity.state) &&
      (!prev || prev.state === "draft") &&
      entity.e_invoice?.status !== "uploaded",
    callback: async (ctx, entity) => {
      if (!entity) return;

      const config = await Services.EInvoices.getConfig(ctx);
      if (config?.connection_status !== "connected") return;

      // Fire and forget: never block (nor fail) the document update
      sendEInvoice(ctx, entity);
    },
    name: "on-sent-e-invoice",
  });
