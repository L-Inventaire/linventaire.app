import Framework from "#src/platform/index";
import Services from "#src/services/index";
import { buildQueryFromMap } from "#src/services/rest/services/utils";
import { Context } from "#src/types";
import { captureException } from "@sentry/node";
import _ from "lodash";
import Contacts, { ContactsDefinition } from "../../contacts/entities/contacts";
import Invoices, { InvoicesDefinition, Recipient } from "../entities/invoices";
import { sendPdf } from "../services/generate-pdf";
import { getTimezoneDay, getTimezoneOffset, normalizeDate } from "../utils";

/**
 * This trigger will generate the invoices for any quote in the state "recurring"
 * - If an invoice must be generated, it will be generated
 * - In either case, the next invoice date will be updated
 * Here is the first (and later) invoices options:
    | "first_day" // First day when recurring state is active, then on a {frequency} basis
    | "first_workday" // First workday when after recurring state was active, then on a {frequency} basis but only workdays
    | "monday" // First monday after recurring state was active, then on a {frequency} basis but only mondays
    | "last_day" // Latest possible day in the recurring period
    | "last_workday" // Latest possible workday in the recurring period
 */
export const generateInvoicesForRecurringQuotes = async (ctx: Context) => {
  // Get all invoices that are late
  const db = await Framework.Db.getService();

  let offset = 0;
  const limit = 100;
  let docs: Invoices[] = [];

  do {
    docs = await db.select<Invoices>(
      ctx,
      InvoicesDefinition.name,
      {
        where: `type = $1 AND state = $2 AND subscription_next_invoice_date < $3 AND subscription_started_at <= $4 AND is_deleted = false`,
        values: ["quotes", "recurring", Date.now(), Date.now()],
      },
      {
        limit,
        offset,
      }
    );

    for (const doc of docs) {
      try {
        await generateInvoicesForRecurringQuote(ctx, doc);
      } catch (e) {
        console.error("Error while generating invoice for quote", e);
        captureException(e);
      }
    }

    offset += limit;
  } while (docs.length === 100);
};

/**
 * This trigger will set the initial next invoice date for all the invoices and quotes that are now in recurring state (when it goes recurring for the first time).
 */
export const setTriggerSetFirstNextInvoice = () => {
  Framework.TriggersManager.registerTrigger<Invoices>(InvoicesDefinition, {
    name: "invoices-recurring-set-first-invoice-date",
    test: (_, next, prev) => {
      return (
        next?.type === "quotes" &&
        next?.state === "recurring" &&
        prev?.state !== next?.state
      );
    },
    callback: async (ctx, quote) => {
      await generateInvoicesForRecurringQuote(ctx, quote);
    },
  });
};

const generateInvoicesForRecurringQuote = async (
  ctx: Context,
  quote: Invoices
) => {
  console.log("Checking recurring invoices to generate for ", quote.id);

  const db = await Framework.Db.getService();

  const client = await db.selectOne<Contacts>(ctx, ContactsDefinition.name, {
    id: quote.client,
    client_id: quote.client_id,
  });

  if (!client) {
    console.error(`Client not found for quote ${quote.id}`);
    // Set an event to the invoice, and put it back to draft
    await db.update<Invoices>(
      ctx,
      InvoicesDefinition.name,
      { id: quote.id, client_id: quote.client_id },
      {
        subscription_next_invoice_date: new Date(
          Date.now() + 1000 * 60 * 60 * 24
        ),
      }
    );
    await Services.Comments.createEvent(ctx, {
      client_id: quote.client_id,
      item_entity: "invoices",
      item_id: quote.id,
      content: `Client was not found, the recurring invoice was put back to draft.`,
      metadata: {
        event_type: "invoice_back_to_draft",
        reason: "Client not found",
      },
    });
    return;
  }

  const lastInvoicesPerFrequency: {
    [freq: string]: { total: number; list: Invoices[] };
  } = {};
  const frequencies = _.uniq(
    quote.content?.map((a) => a.subscription) || []
  ).filter(Boolean);
  for (const frequency of frequencies) {
    lastInvoicesPerFrequency[frequency] = await Services.Rest.search<Invoices>(
      { ...ctx, client_id: quote.client_id },
      InvoicesDefinition.name,
      buildQueryFromMap({
        type: "invoices",
        from_rel_quote: quote.id,
        "from_subscription.frequency": [frequency, "multiple"],
      }),
      {
        index: "emit_date",
        asc: false,
        limit: 1,
      }
    );
  }
  if (!frequencies.filter(Boolean).length) {
    console.log("Re-qualify as non-recurring quote ", quote.id);
    await db.update<Invoices>(
      ctx,
      InvoicesDefinition.name,
      { id: quote.id, client_id: quote.client_id },
      { state: quote.state === "recurring" ? "completed" : "purchase_order" }
    );
    return;
  }

  console.log(
    "Last invoices for ",
    quote.id,
    JSON.stringify(lastInvoicesPerFrequency)
  );

  const { invoices, recheckAt } = getNewInvoicesAndNextDate(
    quote,
    lastInvoicesPerFrequency,
    client.preferences?.timezone || "Europe/Paris"
  );

  console.log("Next invoice check for ", quote.id, recheckAt);

  await db.update<Invoices>(
    ctx,
    InvoicesDefinition.name,
    { id: quote.id, client_id: quote.client_id },
    {
      subscription_next_invoice_date: recheckAt,
    }
  );

  const recipients = await ensureRecipients(ctx, quote, client);

  for (const model of invoices) {
    // Do not create invoices before started recurring
    const startedAt = normalizeDate(
      new Date(quote.subscription_started_at),
      client.preferences?.timezone || "Europe/Paris"
    );
    if (
      !quote.subscription_started_at ||
      new Date().getTime() < new Date(startedAt).getTime()
    ) {
      // This is a period before the recurring started
      continue;
    }

    // Create and send the invoice
    const invoice = await Services.Rest.create<Invoices>(
      { ...ctx, client_id: quote.client_id },
      InvoicesDefinition.name,
      { ...model, recipients, reference: "" }
    );

    // Replace emit_date and set from_subscription as not allowed from Rest in some cases
    await db.update<Invoices>(
      ctx,
      InvoicesDefinition.name,
      { id: invoice.id, client_id: quote.client_id },
      {
        emit_date: new Date(model.emit_date),
        from_subscription: {
          from: new Date(model.from_subscription.from),
          to: new Date(model.from_subscription.to),
          frequency: model.from_subscription.frequency,
        },
      }
    );

    console.log("Generated invoice ", invoice.id, "for ", quote.id);

    if (invoice.state === "sent") {
      await sendPdf(
        ctx,
        invoice,
        invoice.recipients.map((a) => a.email),
        {}
      );
    }
  }
};

export const getNewInvoicesAndNextDate = (
  quote: Pick<
    Invoices,
    | "content"
    | "subscription_started_at"
    | "subscription_next_invoice_date"
    | "state"
    | "id"
    | "subscription"
    | "discount"
  >,
  lastInvoices: {
    [freq: string]: { total?: number; list: Invoices[] };
  },
  timezone: string
) => {
  if (quote.state !== "recurring" || !quote?.subscription_started_at)
    return {
      recheckAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      invoices: [],
    };

  const recurringStartedAt = quote.subscription_started_at;
  const currentDate = new Date(
    Math.min(
      Math.max(
        new Date(recurringStartedAt).getTime(),
        new Date(quote.subscription_next_invoice_date || Date.now()).getTime()
      ),
      Date.now()
    )
  );

  // Get lines per recurring period
  const lines = _.groupBy(quote.content, (a) => a.subscription);

  const nextInvoices: {
    [freq: string]: {
      quote: Partial<Invoices>;
      frequency:
        | "multiple"
        | "daily"
        | "weekly"
        | "monthly"
        | "yearly"
        | string;
      from: number;
      to: number;
      date: number;
      recheckAt: number;
      content: Invoices["content"];
    };
  } = {};

  for (const frequency in lines) {
    if (!frequency) continue; // Not recurring line

    // Select the right next period start from today by simply iterating from recurrence start (not the best way but it's simple)
    const currentPeriodStart = new Date(recurringStartedAt);
    normalizeDate(currentPeriodStart, timezone);
    while (currentPeriodStart.getTime() <= new Date(currentDate).getTime()) {
      applyOffset(currentPeriodStart, frequency, timezone);
    }
    applyOffset(currentPeriodStart, frequency, timezone, -1);

    const { recheckAt, invoicePeriodFrom, invoicePeriodTo, invoiceDate } =
      getLatestInvoiceDate(
        quote.subscription?.invoice_date,
        frequency,
        currentPeriodStart,
        timezone,
        currentDate
      );

    normalizeDate(recheckAt, timezone);

    console.log("Next invoice date for ", quote.id, {
      currentPeriodStart,
      frequency,
      recheckAt,
      invoicePeriodFrom,
      invoicePeriodTo,
      invoiceDate,
      currentDate,
    });

    nextInvoices[frequency] = {
      quote,
      frequency: frequency as
        | "daily"
        | "weekly"
        | "monthly"
        | "yearly"
        | string,
      from: invoicePeriodFrom.getTime(),
      to: invoicePeriodTo.getTime(),
      date: invoiceDate.getTime(),
      recheckAt: recheckAt.getTime(),
      content: lines[frequency],
    };
  }

  // Compute the next date to check invoices
  const recheckAt = new Date(
    _.min(Object.values(nextInvoices).map((a) => a.recheckAt))
  );

  console.log("Next check invoice date for ", quote.id, recheckAt);

  const invoices: Partial<Invoices>[] = [];

  // We'll generate all the late invoices here
  for (const triggerInvoice of Object.values(nextInvoices)) {
    const today = new Date(currentDate);
    normalizeDate(today, timezone);
    // If invoice must be generated today or before
    if (new Date(triggerInvoice?.date).getTime() <= today.getTime()) {
      console.log(
        "Generating invoice for ",
        quote.id,
        triggerInvoice.frequency,
        "for period",
        new Date(triggerInvoice.from).toISOString(),
        new Date(triggerInvoice.to).toISOString()
      );

      // Lookup an existing invoice for this frequency
      const lastInvoicesFreq = lastInvoices[triggerInvoice.frequency];

      // TODO if invoice was done manually, they can be a diff to invoice, we do not support it yet

      if (
        lastInvoicesFreq &&
        lastInvoicesFreq.list?.length &&
        lastInvoicesFreq?.list?.some((a) => {
          // The invoice ends after the current period
          const existingEndsDuringThisOne =
            new Date(a?.from_subscription?.to || 0).getTime() >=
            new Date(triggerInvoice.to).getTime();

          // The invoice has an emit date inside the current period, and has at least one article in common
          const sameArticleEmitAfterThisOne =
            new Date(
              a?.from_subscription?.from || a?.emit_date || 0
            ).getTime() >= new Date(triggerInvoice.date).getTime() &&
            a?.content?.some((a) =>
              triggerInvoice.content?.some((b) => a.article === b.article)
            );
          return existingEndsDuringThisOne || sameArticleEmitAfterThisOne;
        })
      ) {
        console.log(
          "Already invoiced for this period ",
          quote.id,
          triggerInvoice.frequency
        );
        // Already invoiced
        continue;
      }

      invoices.push({
        type: "invoices",
        state: quote.subscription.invoice_state === "sent" ? "sent" : "draft",
        from_rel_quote: [quote.id],
        ..._.pick(quote, [
          "client",
          "attachments",
          "client_id",
          "language",
          "currency",
          "delivery_address",
          "delivery_date",
          "delivery_delay",
          "reminders",
          "tags",
          "format",
        ]),

        content: triggerInvoice.content,
        discount: quote.discount,

        emit_date: new Date(triggerInvoice.date),
        from_subscription: {
          from: new Date(triggerInvoice.from),
          to: new Date(triggerInvoice.to),
          frequency: triggerInvoice.frequency,
        },
      } as Partial<Invoices>);
    }
  }

  return { recheckAt, invoices };
};

/** Function also present in frontend, if changed, change it in front too */
export const applyOffset = (
  date: Date,
  frequencyAndCount: string,
  timezone: string,
  factor = 1
) => {
  const { offset } = getTimezoneOffset(timezone, new Date(date).getTime());
  date.setHours(date.getHours() + offset);

  const frequency = frequencyAndCount.split("_").pop();
  const periodCount = parseInt(
    frequencyAndCount.split("_")?.length === 2
      ? frequencyAndCount.split("_")[0]
      : "1"
  );
  if (frequencyAndCount.split("_").length > 2 || periodCount < 1) {
    throw new Error(`Invalid frequency ${frequencyAndCount}`);
  }

  const monthly = (date: Date) => {
    const dayOfMonth = date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + 1 * factor * periodCount);
    const daysInMonth = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0
    ).getDate();
    date.setDate(Math.min(dayOfMonth, daysInMonth));
  };

  switch (frequency) {
    case "daily":
      date.setDate(date.getDate() + 1 * factor * periodCount);
      break;
    case "weekly":
      date.setDate(date.getDate() + 7 * factor * periodCount);
      break;
    case "monthly":
      monthly(date);
      break;
    case "yearly":
      date.setFullYear(date.getFullYear() + 1 * factor * periodCount);
      break;
    default:
      throw new Error(`Unknown frequency ${frequencyAndCount}`);
  }

  date.setHours(date.getHours() - offset);
};

/**
 * Returns
 * - the current active period
 * - the last invoice we should have
 * - the next invoice date we should check
 */
export const getLatestInvoiceDate = (
  mode: Invoices["subscription"]["invoice_date"],
  frequency: string,
  periodStartDate: Date,
  timezone: string,
  currentDate: Date | number = Date.now()
) => {
  if (new Date(periodStartDate).getTime() > new Date(currentDate).getTime()) {
    throw new Error("Period start date is in the future for invoice");
  }

  console.log({ mode, frequency, periodStartDate, timezone, currentDate });

  const periodBeforeStart = new Date(periodStartDate);
  const periodCurrentStart = new Date(periodStartDate);
  const periodNextStart = new Date(periodStartDate);
  const periodNext2Start = new Date(periodStartDate);
  const periodNext3Start = new Date(periodStartDate);
  applyOffset(periodNextStart, frequency, timezone);
  applyOffset(periodBeforeStart, frequency, timezone, -1);
  applyOffset(periodNext2Start, frequency, timezone, 2);
  applyOffset(periodNext3Start, frequency, timezone, 3);

  const invoicesAndPeriods = [
    getInvoiceDateAndPeriodNormalized(
      periodBeforeStart,
      periodCurrentStart,
      mode,
      timezone
    ),
    getInvoiceDateAndPeriodNormalized(
      periodCurrentStart,
      periodNextStart,
      mode,
      timezone
    ),
    getInvoiceDateAndPeriodNormalized(
      periodNextStart,
      periodNext2Start,
      mode,
      timezone
    ),
    getInvoiceDateAndPeriodNormalized(
      periodNext2Start,
      periodNext3Start,
      mode,
      timezone
    ),
  ];

  console.log("invoicesAndPeriods", invoicesAndPeriods);
  console.log("periodCurrentStart", periodCurrentStart);
  console.log("periodNextStart", periodNextStart);
  console.log("periodNext2Start", periodNext2Start);
  console.log("periodBeforeStart", periodBeforeStart);
  console.log("currentDate", currentDate);
  console.log("mode", mode);
  console.log("frequency", frequency);
  console.log("timezone", timezone);

  const invoiceDate = invoicesAndPeriods
    .filter(
      (a) =>
        new Date(a.date).getTime() <=
        new Date(currentDate).getTime() + 1000 * 60 * 60 * 3 // Ensure we are past the day (with 3h margin to avoid any issue with timezone winter/summer hours etc)
    )
    .pop();
  const recheckAt = invoicesAndPeriods
    .filter(
      (a) =>
        new Date(a.date).getTime() >
        new Date(currentDate).getTime() + 1000 * 60 * 60 * 3
    ) // Ensure we are past the day (with 3h margin to avoid any issue with timezone winter/summer hours etc))
    .shift();

  return {
    recheckAt: recheckAt.date, // Next recheck (next time we must check)
    invoiceDate: invoiceDate.date, // Invoice date (could be in the future or past)
    invoicePeriodFrom: invoiceDate.from, // Period starts
    invoicePeriodTo: invoiceDate.to, // Period ends
  };
};

export const getInvoiceDateAndPeriodNormalized = (
  from: Date,
  to: Date,
  mode: string,
  timezone: string
) => {
  let invoiceDate = getInvoiceDateInPeriod(
    new Date(from),
    new Date(to),
    mode,
    timezone
  );
  invoiceDate = normalizeDate(invoiceDate, timezone);
  from = normalizeDate(from, timezone);
  to = normalizeDate(to, timezone, "to");
  to.setDate(to.getDate() - 1);
  return { from, to, date: invoiceDate };
};

/**
 * Get invoice date for a given period
 */
export const getInvoiceDateInPeriod = (
  from: Date,
  to: Date,
  mode: string,
  timezone: string
) => {
  if (mode === "first_day") {
    return new Date(from);
  } else if (mode === "first_workday") {
    const invoiceDate = new Date(from);
    while (
      getTimezoneDay(invoiceDate, timezone) === 0 ||
      getTimezoneDay(invoiceDate, timezone) === 6
    ) {
      invoiceDate.setDate(invoiceDate.getDate() + 1);
    }
    return invoiceDate;
  } else if (mode === "monday") {
    const invoiceDate = new Date(from);
    while (getTimezoneDay(invoiceDate, timezone) !== 1) {
      invoiceDate.setDate(invoiceDate.getDate() + 1);
    }
    return invoiceDate;
  } else if (mode === "last_day") {
    const invoiceDate = new Date(to);
    invoiceDate.setDate(invoiceDate.getDate() - 1);
    return invoiceDate;
  } else if (mode === "last_workday") {
    const invoiceDate = new Date(to);
    invoiceDate.setDate(invoiceDate.getDate() - 1);
    while (
      getTimezoneDay(invoiceDate, timezone) === 0 ||
      getTimezoneDay(invoiceDate, timezone) === 6
    ) {
      invoiceDate.setDate(invoiceDate.getDate() - 1);
    }
    return invoiceDate;
  }
  return from;
};

export const ensureRecipients = async (
  ctx: Context,
  quote: Invoices,
  client?: Contacts | null,
  contact?: Contacts | null
): Promise<Recipient[]> => {
  const db = await Framework.Db.getService();

  contact =
    contact === undefined
      ? quote.contact
        ? await db.selectOne<Contacts>(ctx, ContactsDefinition.name, {
            id: quote.contact,
            client_id: quote.client_id,
          })
        : null
      : null;

  client =
    client === undefined
      ? await db.selectOne<Contacts>(ctx, ContactsDefinition.name, {
          id: quote.client,
          client_id: quote.client_id,
        })
      : null;

  return [
    client?.email,
    ...(client?.emails || []),
    contact?.email,
    ...(contact?.emails || []),
  ]
    .filter(Boolean)
    .some((a) =>
      quote.recipients
        .map((b) => b.email?.toLocaleLowerCase()?.trim())
        .includes(a.toLocaleLowerCase().trim())
    )
    ? quote.recipients
    : [client?.email, contact?.email].filter(Boolean)?.map(
        (a) =>
          ({
            email: a,
            role: "signer",
          } as Recipient)
      );
};
