import Framework from "#src/platform/index";
import { refreshContactEInvoicesStatusLater } from "../../contacts/services/refresh-e-invoices-status";
import Invoices, { InvoicesDefinition } from "../entities/invoices";

/**
 * When a quote, an invoice or a credit note is created for a customer (or
 * its customer changes), check again the e-invoicing status of the customer
 * if it is not active (only computed when its SIREN changes). Done after the
 * request, the directory never slows down the document creation.
 */
export const setOnClientSetRefreshEInvoicesTrigger = () =>
  Framework.TriggersManager.registerTrigger<Invoices>(InvoicesDefinition, {
    test: (ctx, entity, prev) =>
      !ctx?.import &&
      !!entity?.client &&
      ["quotes", "invoices", "credit_notes"].includes(entity.type) &&
      entity.client !== prev?.client,
    callback: async (_ctx, entity) => {
      if (!entity?.client) return;
      refreshContactEInvoicesStatusLater(entity.client_id, entity.client);
    },
    name: "on-client-set-refresh-e-invoices",
  });
