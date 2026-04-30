import { DateTime } from "luxon";
import _ from "lodash";

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
  forceNextOne = true,
) => {
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
