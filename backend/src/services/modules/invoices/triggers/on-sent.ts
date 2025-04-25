import { default as Framework } from "../../../../platform";
import Invoices, { InvoicesDefinition } from "../entities/invoices";

/** When invoice is updated, if it is sent, then send an email to sign **/
export const setOnSentTrigger = () =>
  Framework.TriggersManager.registerTrigger<Invoices>(InvoicesDefinition, {
    test: (_ctx, entity, previousEntity) => {
      if (!["invoice"].includes(entity.type)) return false;
      if (entity.state !== "sent" || entity.state === previousEntity.state)
        return false;

      return true;
    },
    callback: async (ctx, entity) => {
      // setupDocumentForInvoice(ctx, { entity })
    },
    name: "on-sent-invoices",
  });
