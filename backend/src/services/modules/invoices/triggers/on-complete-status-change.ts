import { insertIntoHistory } from "#src/services/rest/services/history";
import Framework from "../../../../platform";
import Invoices, { InvoicesDefinition } from "../entities/invoices";

// TODO refactor me: this should NOT change the state but only complete the quantities and payments.
// TODO: split this in two triggers, one for quantities and one for state update.

/** Detect when stock_items gets updated to recompute completeness of the invoice (quote/supplier_quote etc) **/
export const setStatusTrigger = () => {
  Framework.TriggersManager.registerTrigger<Invoices>(InvoicesDefinition, {
    name: "set-status-invoices",
    priority: 100, // Do it at the end of the other processes
    test: (_ctx, entity) => entity?.state !== "closed" && !!entity,
    callback: async (ctx, entity, prev, { table }) => {
      // Quote ready for invoicing
      if (entity.type === "quotes" || entity.type === "supplier_quotes") {
        if (prev?.state === "closed") {
          // If we were closed, it is a user action, we'll let it like it is
          return;
        }

        // Managed by the recurring system
        const willBeRecurring =
          entity?.state === "recurring" ||
          ((entity?.state === "purchase_order" ||
            entity?.state === "sent" ||
            entity?.state === "draft") &&
            // Contain recurring stuff or rules
            entity.content.some((a) => a.subscription));
        if (willBeRecurring) {
          return;
        }

        const isCompleted = entity.content.every(
          (a) =>
            a.quantity_delivered >= a.quantity ||
            !a.article ||
            (a.optional && !a.optional_checked)
        );

        if (isCompleted && entity.state === "purchase_order") {
          entity.state = "completed";
        }

        if ((entity.invoiced?.percentage || 0) >= 100) {
          if (
            entity.state === "purchase_order" ||
            entity.state === "completed"
          ) {
            entity.state = "closed";
          }
        } else {
          if (entity.state === "closed") {
            entity.state = isCompleted ? "completed" : "purchase_order";
          }
        }
      }

      // Invoice ready for closing (paid)
      if (
        entity.type === "invoices" ||
        entity.type === "credit_notes" ||
        entity.type === "supplier_invoices" ||
        entity.type === "supplier_credit_notes"
      ) {
        if (prev?.state === "closed") {
          // If we were closed, it is a user action, we'll let it like it is
          return;
        }

        if ((entity.transactions?.percentage || 0) >= 100) {
          // Only invoices in the "sent" state can be marked as closed, if it was in draft for instance, it must first be marked as sent then it will automatically be closed
          if (entity.state === "sent") {
            entity.state = "closed";
          }
        } else {
          // If we did not invoice everything, we'll go back to the previous state (sent)
          if (entity.state === "closed") {
            entity.state = "sent";
          }
        }
      }

      if (prev?.state !== entity.state) {
        await insertIntoHistory(ctx, table, entity);

        const db = await Framework.Db.getService();
        if (new Date(entity.updated_at || 0).getTime() > Date.now() - 2000) {
          // If included in a user update, it takes the user as the updater
          entity.updated_by = "system";
        }
        await db.update<Invoices>(
          ctx,
          InvoicesDefinition.name,
          { client_id: entity.client_id, id: entity.id },
          entity
        );
      }
    },
  });
};
