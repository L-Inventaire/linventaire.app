import { default as Framework } from "../../../../platform";
import { create, search } from "../../../rest/services/rest";
import { buildQueryFromMap } from "../../../rest/services/utils";
import Invoices, { InvoicesDefinition } from "../entities/invoices";
import { computePartialInvoice } from "../services/compute-partial-invoice";

/** When invoice is updated, if it is completed, then trigger next step (generate invoice, change state etc) **/
export const setOnCompletedCreateInvoicesTrigger = () =>
  Framework.TriggersManager.registerTrigger<Invoices>(InvoicesDefinition, {
    test: (_ctx, entity, prev) => {
      return (
        entity &&
        (entity.type === "quotes" || entity.type === "supplier_quotes") &&
        entity.state === "completed" &&
        prev?.state !== "completed"
      );
    },
    callback: async (ctx, entity) => {
      const db = await Framework.Db.getService();

      // TODO: disabled for now, we'll do it if confirmed by Dimitri and Lydie
      return;

      const initialState = entity.state;

      // Subscriptions don't work that way
      // They use the recurring-end stuff, be carreful to not mess with it
      if (entity?.content?.some((a) => a.subscription)) {
        return;
      }

      if (entity.state == "completed") {
        // Not for suppliers for now

        const existing = (
          await search<Invoices>(
            ctx,
            InvoicesDefinition.name,
            buildQueryFromMap({
              from_rel_quote: entity.id,
              type:
                entity.type === "quotes"
                  ? ["invoices", "credit_notes"]
                  : ["supplier_invoices", "supplier_credit_notes"],
            })
          )
        )?.list;

        // Generate remaining invoice
        const { partial_invoice } = computePartialInvoice(entity, existing);

        if (partial_invoice?.total?.total_with_taxes) {
          await create(ctx, InvoicesDefinition.name, {
            ...entity,
            ...partial_invoice,
            client_id: entity.client_id,
            type: entity.type === "quotes" ? "invoices" : "supplier_invoices",
            state: "draft",
            rel_quote: entity.id,
          });
        }
      }

      if (initialState !== entity.state) {
        await db.update(
          ctx,
          InvoicesDefinition.name,
          { client_id: entity.client_id, id: entity.id },
          entity
        );
      }
    },
    name: "on-completed-create-invoices",
  });
