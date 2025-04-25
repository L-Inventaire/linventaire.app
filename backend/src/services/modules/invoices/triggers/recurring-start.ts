import Clients, {
  ClientsDefinition,
} from "#src/services/clients/entities/clients";
import Services from "#src/services/index";
import { buildQueryFromMap } from "#src/services/rest/services/utils";
import { Context } from "#src/types";
import { default as Framework } from "../../../../platform";
import Invoices, { InvoicesDefinition } from "../entities/invoices";
import { normalizeDate } from "../utils";

/**
 * This trigger change the state of quotes to "recurring" when the correct situation takes place:
 * - The quote is in the state "accepted" and start condition is "acceptance_start"
 * - An invoice has been generated for the quote
 *   - If the quote has non recurring components, we wait for them to be completed then recurring starts
 *   - Else any invoice generation will trigger the recurring state
 * - A date has been met and start condition is "date"
 *
 * Note: this trigger will NOT generate the recurring invoices, it will only change the state of the quote to recurring
 */
export const setTriggerStartRecurring = () => {
  // Date start
  Framework.Cron.schedule(
    "invoices-recurring-start-date",
    "0 0 6 * * *", // Every day at 6am UTC
    async (ctx) => {
      const db = await Framework.Db.getService();

      let offset = 0;
      const limit = 200;
      let candidates: Invoices[] = [];
      do {
        candidates = await db.select<Invoices>(
          ctx,
          InvoicesDefinition.name,
          {
            type: "quotes",
            state: "purchase_order",
            has_subscription: true,
          } as Partial<Invoices>,
          { limit, offset }
        );

        for (const candidate of candidates) {
          if (candidate.subscription?.start_type === "date") {
            await checkIfQuoteMustStartRecurring(ctx, candidate);
          }
        }

        offset += limit;
      } while (candidates.length === limit);
    }
  );

  // after_first_invoice
  Framework.TriggersManager.registerTrigger<Invoices>(InvoicesDefinition, {
    name: "invoices-recurring-start-first-invoice",
    test: (_, next, prev) => {
      return (
        next?.type === "invoices" &&
        ["sent", "completed", "closed"].includes(next?.state) &&
        next?.state !== prev?.state
      );
    },
    callback: async (ctx, invoice) => {
      const db = await Framework.Db.getService();
      if (!invoice.from_rel_quote) {
        return;
      }
      for (const id of invoice.from_rel_quote) {
        const quote = await db.selectOne<Invoices>(
          ctx,
          InvoicesDefinition.name,
          {
            id,
          }
        );
        if (!quote || quote.state === "recurring") {
          return;
        }
        await checkIfQuoteMustStartRecurring(ctx, quote);
      }
    },
  });

  // Acceptance start
  Framework.TriggersManager.registerTrigger<Invoices>(InvoicesDefinition, {
    name: "invoices-recurring-start",
    priority: 75,
    test: (_, next, prev) => {
      return (
        next?.type === "quotes" &&
        next?.state === "purchase_order" &&
        prev?.state !== next?.state &&
        next?.content?.some((a) => a.subscription)
      );
    },
    callback: async (ctx, invoice) =>
      await checkIfQuoteMustStartRecurring(ctx, invoice),
  });
};

const startRecurring = async (
  ctx: Context,
  quote: Invoices,
  startDate?: number
) => {
  const db = await Framework.Db.getService();
  await db.update<Invoices>(
    ctx,
    InvoicesDefinition.name,
    { id: quote.id },
    {
      state: "recurring",
      subscription_started_at:
        quote.subscription?.start_type === "date" && quote.subscription.start
          ? new Date(quote.subscription.start)
          : new Date(startDate || Date.now()),
    }
  );
};

const checkIfQuoteMustStartRecurring = async (
  ctx: Context,
  quote: Invoices
) => {
  if (
    quote.state === "recurring" ||
    quote.state === "closed" ||
    quote.state === "completed" ||
    quote.type !== "quotes"
  ) {
    return;
  }

  if (!quote.content.some((a) => a.subscription)) {
    return;
  }

  // Quote accepted
  if (quote.subscription?.start_type === "acceptance_start") {
    if (quote.state === "purchase_order") {
      await startRecurring(ctx, quote);
    }

    return;
  }

  // Date is in the past or today
  if (quote.subscription?.start_type === "date") {
    const today = new Date();
    const startDate = new Date(quote.subscription.start);

    // Set both to midnight
    const db = await Framework.Db.getService();
    const client = await db.selectOne<Clients>(ctx, ClientsDefinition.name, {
      id: quote.client_id,
    });
    const timezone = client?.preferences?.timezone ?? "Europe/Paris";
    normalizeDate(today, timezone);
    normalizeDate(startDate, timezone);

    if (startDate.getTime() <= today.getTime()) {
      await startRecurring(ctx, quote);
    }

    return;
  }

  // Now the most complex case, we need to check existing invoices
  const invoices = (
    await Services.Rest.search<Invoices>(
      { ...ctx, client_id: quote.client_id },
      InvoicesDefinition.name,
      buildQueryFromMap({ from_rel_quote: quote.id }),
      { limit: 50 }
    )
  ).list.filter((a) => ["invoices", "credit_notes"].includes(a.type));
  // If only drafts, then we can't start recurring
  if (!invoices.some((a) => a.state !== "draft")) return;

  let oldestEmitDate = Date.now();
  for (const invoice of invoices) {
    if (new Date(invoice.emit_date).getTime() < oldestEmitDate) {
      oldestEmitDate = new Date(invoice.emit_date).getTime();
    }
  }

  // If at least one invoice is present, then we start the "recurring" state
  await startRecurring(ctx, quote, oldestEmitDate);
  return;
};
