import { DateTime } from "luxon";
import { default as Framework } from "../../../../platform";
import Invoices, { InvoicesDefinition } from "../entities/invoices";
import _ from "lodash";

/** WARNING This same code exists in frontend, please update both */
export const computePaymentDelayDate = (invoice: Invoices): DateTime => {
  const payment = invoice.payment_information;
  const delayType = payment?.delay_type ?? "direct";

  let date = DateTime.fromJSDate(
    new Date(
      (invoice.type === "quotes"
        ? invoice.wait_for_completion_since
        : invoice.emit_date) || invoice.emit_date
    )
  );

  let delay = 30;
  try {
    delay = parseInt(payment.delay as any);
    if (isNaN(delay)) delay = 30;
  } catch (e) {
    delay = 30;
  }

  if (delayType === "direct") {
    date = date.plus({ days: delay || 30 });
  }
  if (delayType === "month_end_delay_first") {
    date = date.plus({ days: delay });
    date = date.endOf("month");
  }
  if (delayType === "month_end_delay_last") {
    date = date.endOf("month");
    date = date.plus({ days: delay });
  }
  if (delayType === "date") {
    const todayMidnight = DateTime.now().startOf("day").toMillis();
    date = DateTime.fromMillis(payment.delay_date || todayMidnight);
  }

  return date;
};

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
