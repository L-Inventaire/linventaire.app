import Framework from "#src/platform/index";
import Invoices, {
  InvoicesDefinition,
} from "#src/services/modules/invoices/entities/invoices";
import { computePaymentDelayDate } from "#src/services/modules/invoices/triggers/on-payment-delay-changed";
import { Context } from "#src/types";

export const fixPaymentDatesInvoices = async (ctx: Context) => {
  // For all invoices
  const db = await Framework.Db.getService();
  let invoices: Invoices[] = [];
  let offset = 0;
  do {
    invoices = await db.select<Invoices>(
      ctx,
      InvoicesDefinition.name,
      {},
      {
        offset,
        limit: 1000,
        index: "id",
      }
    );

    for (const entity of invoices) {
      if (
        !entity.payment_information?.computed_date ||
        entity.payment_information.computed_date >
          Date.now() + 30 * 24 * 60 * 60 * 1000
      ) {
        if (!entity.payment_information) entity.payment_information = {} as any;
        entity.payment_information.computed_date =
          computePaymentDelayDate(entity).toMillis();

        await db.update<Invoices>(
          ctx,
          InvoicesDefinition.name,
          { id: entity.id, client_id: entity.client_id },
          {
            payment_information: entity.payment_information,
          },
          { triggers: false }
        );
      }
    }

    console.log(
      "[migrations] Invoices... offset=",
      offset,
      "length=",
      invoices.length
    );

    offset += invoices.length;
  } while (invoices.length > 0);

  console.log("[migrations] Updated payment dates for invoices");
};
