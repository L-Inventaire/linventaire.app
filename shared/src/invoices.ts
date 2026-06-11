import _ from "lodash";
import { DateTime } from "luxon";
import { getVatCode, standardCodeToVatValue } from "./consts";
import { InvoiceReview, InvoicesBase as Invoices, InvoiceTotal } from "./types";

// ---------------------------------------------------------------------------
// "To review" reminders (quotes): recurring rules made of a day-of-month spec
// and a month spec. Shared by the frontend (component) and the backend (the
// trigger that sets a default reminder when a quote becomes recurring).
// ---------------------------------------------------------------------------

// Resolve a reminder day-of-month spec to a timestamp (noon, to avoid TZ edges)
const resolveReviewDay = (year: number, month0: number, day: string): number => {
  const daysInMonth = new Date(year, month0 + 1, 0).getDate();
  let d: number;
  if (day === "first") d = 1;
  else if (day === "last") d = daysInMonth;
  else if (day === "middle") d = 15;
  else d = Math.min(Math.max(parseInt(day) || 1, 1), daysInMonth);
  return new Date(year, month0, d, 12, 0, 0, 0).getTime();
};

// All review occurrences (from every reminder rule) within [startTs, endTs]
export const getReviewOccurrences = (
  review: Partial<InvoiceReview> | undefined,
  startTs: number,
  endTs: number,
): number[] => {
  if (!review?.reminders?.length) return [];
  const occurrences: number[] = [];
  const startYear = new Date(startTs).getFullYear();
  const endYear = new Date(endTs).getFullYear();
  for (const reminder of review.reminders) {
    if (!reminder?.day || !reminder?.month) continue;
    for (let year = startYear; year <= endYear; year++) {
      if (reminder.month === "every") {
        for (let m = 0; m < 12; m++) {
          occurrences.push(resolveReviewDay(year, m, reminder.day));
        }
      } else {
        const month0 = (parseInt(reminder.month) || 1) - 1;
        occurrences.push(resolveReviewDay(year, month0, reminder.day));
      }
    }
  }
  return _.uniq(occurrences)
    .filter((t) => t >= startTs && t <= endTs)
    .sort((a, b) => a - b);
};

const FIVE_YEARS_MS = 1000 * 60 * 60 * 24 * 366 * 5;

// Next review date strictly after the given timestamp (null if none)
export const getNextReviewDate = (
  review: Partial<InvoiceReview> | undefined,
  fromTs: number,
): number | null => {
  const occurrences = getReviewOccurrences(review, fromTs, fromTs + FIVE_YEARS_MS);
  return occurrences.find((t) => t > fromTs) ?? null;
};

// Last review date strictly before the given timestamp (null if none)
export const getPrevReviewDate = (
  review: Partial<InvoiceReview> | undefined,
  beforeTs: number,
): number | null => {
  const occurrences = getReviewOccurrences(
    review,
    beforeTs - FIVE_YEARS_MS,
    beforeTs,
  ).filter((t) => t < beforeTs);
  return occurrences.length ? occurrences[occurrences.length - 1] : null;
};

export const applyOffset = (
  date: Date,
  frequencyAndCount: string,
  timezone: string,
  factor = 1,
) => {
  const { offset } = getTimezoneOffset(timezone, new Date(date).getTime());
  date.setHours(date.getHours() + offset);

  const frequency = frequencyAndCount.split("_").pop();
  const periodCount = parseInt(
    frequencyAndCount.split("_")?.length === 2
      ? frequencyAndCount.split("_")[0]
      : "1",
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
      0,
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

export const getTimezoneOffset = (timezone: string, date?: Date | number) => {
  const targetDate = date ? new Date(date) : new Date();

  // Generating the formatted text
  // Setting the timeZoneName to longOffset will convert PDT to GMT-07:00
  const dateText = Intl.DateTimeFormat([], {
    timeZone: timezone,
    timeZoneName: "longOffset",
  }).format(targetDate);

  // Scraping the numbers we want from the text
  // The default value '+0' is needed when the timezone is missing the number part. Ex. Africa/Bamako --> GMT
  let timezoneString = dateText.split(" ")[1].slice(3) || "+0";

  // Getting the offset
  let timezoneOffset = parseInt(timezoneString.split(":")[0]) * 60;

  // Checking for a minutes offset and adding if appropriate
  if (timezoneString.includes(":")) {
    timezoneOffset = timezoneOffset + parseInt(timezoneString.split(":")[1]);
  } else if (timezoneOffset === 0) {
    timezoneString = "";
  }

  return {
    offset: timezoneOffset,
    suffix: timezoneString,
    offsetms: timezoneOffset * 60000,
  };
};

/** WARNING This same code exists in frontend, please update both */
export const computePaymentDelayDate = (invoice: {
  type: string;
  payment_information?: {
    delay_type?: string;
    delay?: string | number;
    delay_date?: string | number;
  };
  wait_for_completion_since?: string | number | Date | null;
  emit_date: string | number | Date;
}): DateTime => {
  const payment = invoice.payment_information || {};
  const delayType = payment?.delay_type ?? "direct";
  const emitDate = invoice.emit_date || new Date().getTime();

  let date = DateTime.fromJSDate(
    new Date(
      (invoice.type === "quotes"
        ? invoice.wait_for_completion_since
        : emitDate) || emitDate,
    ),
  );

  let delay = 30;
  try {
    delay = parseInt(payment.delay as any);
    if (isNaN(delay)) delay = 30;
  } catch (e: any) {
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
    date = DateTime.fromMillis(
      new Date(payment.delay_date || todayMidnight).getTime(),
    );
  }

  return date;
};
const getTimezoneDay = (date: Date) => {
  return new Date(date).getDay();
};

export const getInvoiceDateInPeriod = (from: Date, to: Date, mode: string) => {
  if (mode === "first_day") {
    return new Date(from);
  } else if (mode === "first_workday") {
    const invoiceDate = new Date(from);
    while (
      getTimezoneDay(invoiceDate) === 0 ||
      getTimezoneDay(invoiceDate) === 6
    ) {
      invoiceDate.setDate(invoiceDate.getDate() + 1);
    }
    return invoiceDate;
  } else if (mode === "monday") {
    const invoiceDate = new Date(from);
    while (getTimezoneDay(invoiceDate) !== 1) {
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
      getTimezoneDay(invoiceDate) === 0 ||
      getTimezoneDay(invoiceDate) === 6
    ) {
      invoiceDate.setDate(invoiceDate.getDate() - 1);
    }
    return invoiceDate;
  }
  return from;
};

export const getInvoiceNextDate = (
  quote: {
    state: string;
    subscription_started_at?: string | number | Date;
    subscription_next_invoice_date?: string | number | Date;
    content?: { subscription?: string }[];
    subscription?: { invoice_date?: string };
  },
  options: { forceNextOne: boolean; ignoreEndDate: boolean } = {
    forceNextOne: true, // To avoid showing in frontend today's date if it should be today
    ignoreEndDate: true, // Some processes rely on this function to get the next invoice date even after the end of the subscription, so by default we ignore the end date here. The caller can choose to take it into account if needed.
  },
) => {
  const forceNextOne = options?.forceNextOne ?? true;

  if (quote.state !== "recurring" || !quote?.subscription_started_at)
    return null;

  const recurringStartedAt = quote.subscription_started_at || 0;
  const currentDate = new Date(
    Math.min(
      Math.max(
        new Date(recurringStartedAt).getTime(),
        new Date(quote.subscription_next_invoice_date || Date.now()).getTime(),
      ),
      Date.now(),
    ),
  );

  // Get lines per recurring period
  const lines = _.groupBy(quote.content, (a) => a.subscription);

  let minNextInvoiceDate = null;

  for (const frequency in lines) {
    if (!frequency) continue; // Not recurring line

    try {
      // Select the right next period start from today by simply iterating from recurrence start (not the best way but it's simple)
      let currentPeriodStart = new Date(0);
      const currentPeriodEnd = new Date(recurringStartedAt);
      while (currentPeriodStart.getTime() <= new Date(currentDate).getTime()) {
        currentPeriodStart = new Date(currentPeriodEnd);
        applyOffset(
          currentPeriodEnd,
          frequency,
          Intl.DateTimeFormat().resolvedOptions().timeZone,
        );

        const nextInvoiceDate = getInvoiceDateInPeriod(
          currentPeriodStart,
          currentPeriodEnd,
          quote.subscription?.invoice_date || ("first_day" as any),
        );

        if (
          (minNextInvoiceDate === null ||
            minNextInvoiceDate > nextInvoiceDate.getTime()) &&
          (!forceNextOne || nextInvoiceDate.getTime() >= new Date().getTime())
        ) {
          minNextInvoiceDate = nextInvoiceDate.getTime();
        }
      }
    } catch (e: any) {
      // Not a valid frequency, ignoring
    }
  }

  return minNextInvoiceDate;
};

export const getTvaValue = (tva: string): number => {
  tva = getVatCode(tva || "") || "";
  return (standardCodeToVatValue[tva] || 0) / 100;
};

export const computePricesFromInvoice = (
  invoice: Pick<Invoices, "content" | "discount">,
  checkedIndexes?: { [key: number]: boolean },
): Invoices["total"] => {
  let initial = 0;
  let discount = 0;

  const content = [...(invoice.content || [])];
  for (let index = 0; index < content.length; index++) {
    const item = content[index];
    let value = content[index]?.optional
      ? content[index]?.optional_checked
      : true;

    if (_.has(checkedIndexes, index)) {
      value = ["true", "1", 1, true].includes(
        checkedIndexes?.[index] as unknown as string,
      )
        ? true
        : false;
    }

    content[index] = {
      ...item,
      optional_checked: value || false,
    };
  }

  const vatBreakdown: {
    [vat: string]: NonNullable<InvoiceTotal["vat_breakdown"]>[0];
  } = {};

  content.forEach((item) => {
    if (!item.optional_checked) return;

    const itemsPrice =
      (parseFloat(item.unit_price as any) || 0) *
      (parseFloat(item.quantity as any) || 0);

    let itemsDiscount = 0;
    if (item.discount?.mode === "percentage") {
      itemsDiscount =
        itemsPrice * (parseFloat(item.discount.value as any) / 100);
    } else if (item.discount?.mode === "amount") {
      itemsDiscount = parseFloat(item.discount.value as any);
    }

    const taxableAmount =
      (itemsPrice - itemsDiscount) * getTvaValue(item.tva || "");

    initial += itemsPrice;
    discount += itemsDiscount;

    const tvaCode = item.tva || "O:VATEX-EU-O";
    if (vatBreakdown[tvaCode]) {
      vatBreakdown[tvaCode].taxable_amount += parseFloat(
        (itemsPrice - itemsDiscount).toFixed(2),
      );
      vatBreakdown[tvaCode].tax_amount += parseFloat(taxableAmount.toFixed(2));
    } else {
      vatBreakdown[tvaCode] = {
        tva: tvaCode,
        taxable_amount: parseFloat((itemsPrice - itemsDiscount).toFixed(2)),
        tax_amount: parseFloat(taxableAmount.toFixed(2)),
      };
    }
  });

  let globalDiscount = 0;
  if (invoice.discount?.mode === "percentage") {
    globalDiscount =
      (initial - discount) * (parseFloat(invoice.discount.value as any) / 100);
  } else if (invoice.discount?.mode === "amount") {
    globalDiscount = parseFloat(invoice.discount.value as any);
  }

  // Apply discount proportionally to each VAT rate in breakdown
  const documentWideAllowancesBreakdown: {
    [vat: string]: NonNullable<InvoiceTotal["allowances_breakdown"]>[0];
  } = {};
  for (const vat in vatBreakdown) {
    if (initial - discount === 0) break; // Avoid division by zero if total is 0 after discounts
    const proportion = vatBreakdown[vat].taxable_amount / (initial - discount);
    const discountAmount = globalDiscount * proportion;
    const totalProportion = (initial - discount) * proportion;
    vatBreakdown[vat].taxable_amount -= parseFloat(discountAmount.toFixed(2));
    vatBreakdown[vat].tax_amount -= parseFloat(
      (discountAmount * getTvaValue(vat)).toFixed(2),
    );

    if (documentWideAllowancesBreakdown[vat]) {
      documentWideAllowancesBreakdown[vat].base_amount += parseFloat(
        totalProportion.toFixed(2),
      );
      documentWideAllowancesBreakdown[vat].amount += parseFloat(
        discountAmount.toFixed(2),
      );
    } else {
      documentWideAllowancesBreakdown[vat] = {
        base_amount: parseFloat(totalProportion.toFixed(2)),
        amount: parseFloat(discountAmount.toFixed(2)),
        tva: vat,
      };
    }
  }

  const allTaxes = Object.values(vatBreakdown).reduce(
    (sum, vat) => sum + vat.tax_amount,
    0,
  );
  const total = initial - discount - globalDiscount;
  const total_with_taxes = total + allTaxes;

  if (isNaN(total_with_taxes)) {
    console.log({
      total_with_taxes,
      total,
      allTaxes,
      initial,
      discount,
      globalDiscount,
      vatBreakdown,
    });
  }

  return {
    initial: parseFloat(initial.toFixed(2)),
    discount: parseFloat((discount + globalDiscount).toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    taxes: parseFloat(allTaxes.toFixed(2)),
    total_with_taxes: parseFloat(total_with_taxes.toFixed(2)),
    vat_breakdown: Object.keys(vatBreakdown).map((key) => vatBreakdown[key]),
    allowances_breakdown: Object.keys(documentWideAllowancesBreakdown).map(
      (key) => documentWideAllowancesBreakdown[key],
    ),
  };
};

export const computeDeliveryDelayDate = (invoice: Invoices): DateTime => {
  const delayType = invoice?.delivery_date
    ? "delivery_date"
    : invoice?.delivery_delay
      ? "delivery_delay"
      : "no_delivery";

  let date = DateTime.fromMillis(
    new Date(invoice.wait_for_completion_since ?? Date.now()).getTime(),
  );

  if (delayType === "delivery_date") {
    date = DateTime.fromMillis(
      new Date(invoice.delivery_date ?? Date.now()).getTime(),
    );
  }
  if (delayType === "delivery_delay") {
    let delay = 30;
    try {
      delay = parseInt(invoice.delivery_delay as any);
      if (isNaN(delay)) delay = 30;
    } catch (_: any) {
      delay = 30;
    }
    date = date.plus({ days: delay });
  }

  return date;
};

export const isDeliveryLate = (invoice: Invoices): boolean => {
  return DateTime.now() > computeDeliveryDelayDate(invoice);
};

export const isPaymentLate = (invoice: Invoices): boolean => {
  return DateTime.now() > computePaymentDelayDate(invoice);
};

export const isComplete = (invoice: Invoices): boolean => {
  return !invoice.content?.some(
    (item) => (item.quantity_delivered || 0) > (item.quantity || 0),
  );
};
