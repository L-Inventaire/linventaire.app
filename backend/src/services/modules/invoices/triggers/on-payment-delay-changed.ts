import { DateTime } from "luxon";
import { default as Framework } from "../../../../platform";
import Invoices, { InvoicesDefinition } from "../entities/invoices";
import _ from "lodash";
import { computePaymentDelayDate } from "@shared/invoices";

export const setOnPaymentDelayChanged = () =>
  Framework.TriggersManager.registerTrigger<Invoices>(InvoicesDefinition, {
    test: (_ctx, entity, oldEntity) => {
      return (
        !!entity &&
        (!_.isEqual(
          _.omit(entity?.payment_information, "computed_date"),
          _.omit(oldEntity?.payment_information, "computed_date")
        ) ||
          entity?.emit_date !== oldEntity?.emit_date ||
          entity?.wait_for_completion_since !==
            oldEntity?.wait_for_completion_since ||
          (entity?.state !== oldEntity?.state && oldEntity?.state !== "closed"))
      );
    },
    callback: async (ctx, entity) => {
      if (!entity) return;

      const db = await Framework.Db.getService();
      entity.payment_information = entity.payment_information || ({} as any);
      entity.payment_information.computed_date =
        computePaymentDelayDate(entity).toMillis();

      await db.update<Invoices>(
        ctx,
        InvoicesDefinition.name,
        { id: entity.id },
        {
          payment_information: entity.payment_information,
        }
      );
    },
    name: "on-payment-delay-changed-invoices",
  });
