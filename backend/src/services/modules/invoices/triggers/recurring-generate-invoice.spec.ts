import { describe, expect, test } from "@jest/globals";
import {
  getNewInvoicesAndNextDate,
  getLatestInvoiceDate,
  applyOffset,
} from "./recurring-generate-invoice";
import { normalizeDate } from "../utils";
import Invoices from "../entities/invoices";

const baseQuote = {
  state: "recurring",
  id: "qu-o123-te",
  discount: { mode: "percent", value: 0 },
};

// Reminder tests are done in UTC to replicate server settings

describe("recurring-generate-invoice", () => {
  it("should always be UTC", () => {
    // Front MUST send date-related items as UTC valid dates
    expect(new Date().getTimezoneOffset()).toBe(0);
  });

  test("normalizeDate", async () => {
    expect(normalizeDate(new Date("2024-01-01T14:23:12Z"), "UTC")).toEqual(
      new Date("2024-01-01T00:00:00Z")
    );
    expect(
      normalizeDate(new Date("2024-01-01T14:23:12Z"), "UTC", "to")
    ).toEqual(new Date("2024-01-01T23:59:59.999Z"));

    // A Paris user chosed 2024-01-01 15:23:12 (it's 14:23:12 in UTC)
    // midnight for him is 23:00:00 in UTC
    expect(
      normalizeDate(new Date("2024-01-01T14:23:12Z"), "Europe/Paris")
    ).toEqual(new Date("2023-12-31T23:00:00Z"));
    // A Paris user chosed 2024-01-01 15:23:12 (it's 14:23:12 in UTC)
    // midnight for him is 23:00:00 in UTC
    expect(
      normalizeDate(new Date("2024-01-01T14:23:12Z"), "Europe/Paris", "to")
    ).toEqual(new Date("2024-01-01T22:59:59.999Z"));
  });

  test("applyOffset", async () => {
    let date = new Date("2024-01-01T00:00:00+01:00");
    applyOffset(date, "monthly", "Europe/Paris");
    expect(date).toEqual(new Date("2024-01-31T23:00:00Z"));

    date = new Date("2024-01-01T00:00:00+01:00");
    applyOffset(date, "2_monthly", "Europe/Paris");
    expect(date).toEqual(new Date("2024-02-29T23:00:00Z"));

    date = new Date("2024-02-01T00:00:00+01:00");
    applyOffset(date, "monthly", "Europe/Paris");
    expect(date).toEqual(new Date("2024-02-29T23:00:00Z"));
  });

  test("getLatestInvoiceDate - Timezones", async () => {
    let throwed = false;
    try {
      getLatestInvoiceDate(
        "first_day",
        "monthly",
        new Date("2024-02-01"),
        "UTC",
        new Date("2024-01-01")
      );
    } catch (e) {
      throwed = true;
    }
    expect(throwed).toBe(true);

    let timezone = "Europe/Paris";
    let test = getLatestInvoiceDate(
      "first_day",
      "monthly",
      new Date("2024-01-01T00:00:00+01:00"), // Written as a Paris user
      timezone,
      new Date("2024-01-01T00:00:04+01:00") // Execute after few seconds on server
    );
    expect(test.recheckAt).toEqual(new Date("2024-01-31T23:00:00.000Z"));
    expect(test.invoiceDate).toEqual(new Date("2023-12-31T23:00:00.000Z"));
    expect(test.invoicePeriodFrom).toEqual(
      new Date("2023-12-31T23:00:00.000Z")
    );
    expect(test.invoicePeriodTo).toEqual(new Date("2024-01-31T22:59:59.999Z"));

    timezone = "UTC";
    test = getLatestInvoiceDate(
      "first_day",
      "2_monthly",
      new Date("2024-01-01T00:00:00+00:00"),
      timezone,
      new Date("2024-01-12T00:00:04")
    );
    expect(test.recheckAt).toEqual(new Date("2024-03-01"));
    expect(test.invoiceDate).toEqual(new Date("2024-01-01"));
    expect(test.invoicePeriodFrom).toEqual(new Date("2024-01-01"));
    expect(test.invoicePeriodTo).toEqual(new Date("2024-02-29T23:59:59.999Z"));

    timezone = "America/Lima"; // This one doesn't change summer/winter
    test = getLatestInvoiceDate(
      "first_day",
      "monthly",
      new Date("2024-01-01T00:00:00-05:00"),
      timezone,
      new Date("2024-01-04")
    );
    expect(test.recheckAt).toEqual(new Date("2024-02-01T05:00"));
    expect(test.invoiceDate).toEqual(new Date("2024-01-01T05:00"));
    expect(test.invoicePeriodFrom).toEqual(new Date("2024-01-01T05:00"));
    expect(test.invoicePeriodTo).toEqual(new Date("2024-02-01T04:59:59.999Z"));

    timezone = "Europe/Paris";
    test = getLatestInvoiceDate(
      "first_day",
      "monthly",
      new Date("2024-01-01T00:00:00+01:00"),
      timezone,
      new Date("2024-01-04")
    );
    expect(test.recheckAt).toEqual(new Date("2024-01-31T23:00:00.000Z"));
    expect(test.invoiceDate).toEqual(new Date("2023-12-31T23:00:00.000Z"));
    expect(test.invoicePeriodFrom).toEqual(
      new Date("2023-12-31T23:00:00.000Z")
    );
    expect(test.invoicePeriodTo).toEqual(new Date("2024-01-31T22:59:59.999Z"));

    timezone = "Europe/Paris";
    test = getLatestInvoiceDate(
      "last_day",
      "daily",
      new Date("2024-01-01T00:00:00+01:00"),
      timezone,
      new Date("2024-01-01")
    );
    expect(test.recheckAt).toEqual(new Date("2024-01-01T23:00:00Z"));
    expect(test.invoiceDate).toEqual(new Date("2023-12-31T23:00:00Z"));
    expect(test.invoicePeriodFrom).toEqual(new Date("2023-12-31T23:00:00Z"));
    expect(test.invoicePeriodTo).toEqual(new Date("2024-01-01T22:59:59.999Z"));
  });

  test("getLatestInvoiceDate - Modes", async () => {
    let timezone = "Europe/Paris";
    let test = getLatestInvoiceDate(
      "first_day",
      "monthly",
      new Date("2024-01-01T00:00:00+01:00"), // Written as a Paris user
      timezone,
      new Date("2024-01-01T00:00:04+01:00") // Execute after few seconds on server
    );
    expect(test.recheckAt).toEqual(new Date("2024-01-31T23:00:00.000Z"));
    expect(test.invoiceDate).toEqual(new Date("2023-12-31T23:00:00.000Z"));
    expect(test.invoicePeriodFrom).toEqual(
      new Date("2023-12-31T23:00:00.000Z")
    );
    expect(test.invoicePeriodTo).toEqual(new Date("2024-01-31T22:59:59.999Z"));

    timezone = "Europe/Paris";
    test = getLatestInvoiceDate(
      "last_day",
      "monthly",
      new Date("2024-01-01T00:00:00+01:00"), // Written as a Paris user
      timezone,
      new Date("2024-01-01T00:00:04+01:00") // Execute after few seconds on server
    );
    expect(test.recheckAt).toEqual(new Date("2024-01-30T23:00:00.000Z"));
    expect(test.invoiceDate).toEqual(new Date("2023-12-30T23:00:00.000Z"));
    expect(test.invoicePeriodFrom).toEqual(
      new Date("2023-11-30T23:00:00.000Z")
    );
    expect(test.invoicePeriodTo).toEqual(new Date("2023-12-31T22:59:59.999Z"));

    timezone = "Europe/Paris";
    test = getLatestInvoiceDate(
      "monday",
      "monthly",
      new Date("2025-01-01T00:00:00+01:00"), // Written as a Paris user
      timezone,
      new Date("2025-01-01T00:00:04+01:00") // Execute after few seconds on server
    );
    expect(test.recheckAt).toEqual(new Date("2025-01-05T23:00:00.000Z"));
    expect(test.invoiceDate).toEqual(new Date("2024-12-01T23:00:00.000Z"));
    expect(test.invoicePeriodFrom).toEqual(
      new Date("2024-11-30T23:00:00.000Z")
    );
    expect(test.invoicePeriodTo).toEqual(new Date("2024-12-31T22:59:59.999Z"));

    timezone = "Europe/Paris";
    test = getLatestInvoiceDate(
      "first_workday",
      "monthly",
      new Date("2025-01-01T00:00:00+01:00"), // Written as a Paris user
      timezone,
      new Date("2025-01-01T00:00:04+01:00") // Execute after few seconds on server
    );
    expect(test.recheckAt).toEqual(new Date("2025-02-02T23:00:00.000Z"));
    expect(test.invoiceDate).toEqual(new Date("2024-12-31T23:00:00.000Z"));
    expect(test.invoicePeriodFrom).toEqual(
      new Date("2024-12-31T23:00:00.000Z")
    );
    expect(test.invoicePeriodTo).toEqual(new Date("2025-01-31T22:59:59.999Z"));

    timezone = "Europe/Paris";
    test = getLatestInvoiceDate(
      "last_workday",
      "monthly",
      new Date("2025-01-01T00:00:00+01:00"), // Written as a Paris user
      timezone,
      new Date("2025-01-01T00:00:04+01:00") // Execute after few seconds on server
    );
    expect(test.recheckAt).toEqual(new Date("2025-01-30T23:00:00.000Z"));
    expect(test.invoiceDate).toEqual(new Date("2024-12-30T23:00:00.000Z"));
    expect(test.invoicePeriodFrom).toEqual(
      new Date("2024-11-30T23:00:00.000Z")
    );
    expect(test.invoicePeriodTo).toEqual(new Date("2024-12-31T22:59:59.999Z"));

    timezone = "Europe/Paris";
    test = getLatestInvoiceDate(
      "last_day",
      "daily",
      new Date("2024-01-01T00:00:00+01:00"),
      timezone,
      new Date("2024-01-01")
    );
    expect(test.recheckAt).toEqual(new Date("2024-01-01T23:00:00Z"));
    expect(test.invoiceDate).toEqual(new Date("2023-12-31T23:00:00Z"));
    expect(test.invoicePeriodFrom).toEqual(new Date("2023-12-31T23:00:00Z"));
    expect(test.invoicePeriodTo).toEqual(new Date("2024-01-01T22:59:59.999Z"));
  });

  test("Check simple case", async () => {
    const quote = {
      ...baseQuote,
      content: [
        {
          subscription: "monthly",
        },
      ],
      subscription_started_at: new Date("2024-01-01"),
      subscription: { invoice_state: "draft", invoice_date: "first_day" },
      subscription_next_invoice_date: new Date("2024-01-15"),
    } as Pick<
      Invoices,
      | "content"
      | "subscription_started_at"
      | "subscription_next_invoice_date"
      | "state"
      | "id"
      | "subscription"
      | "discount"
    >;
    const existingInvoices = {
      monthly: {
        list: [],
      },
    };

    let res = getNewInvoicesAndNextDate(
      quote,
      existingInvoices,
      "Europe/Paris"
    );
    let invoices = res.invoices;
    let recheckAt = res.recheckAt;

    expect(recheckAt).toEqual(new Date("2024-01-31T23:00:00.000Z"));
    expect(invoices.length).toEqual(1);
    expect(invoices[0].content.length).toEqual(1);
    expect(invoices[0].from_subscription.frequency).toEqual("monthly");
    expect(invoices[0].emit_date).toEqual(new Date("2023-12-31T23:00:00.000Z"));
    expect(invoices[0].from_subscription.from).toEqual(
      new Date("2023-12-31T23:00:00.000Z")
    );
    expect(invoices[0].from_subscription.to).toEqual(
      new Date("2024-01-31T22:59:59.999Z")
    );

    quote.subscription_next_invoice_date = recheckAt;

    res = getNewInvoicesAndNextDate(
      quote,
      {
        monthly: {
          list: [
            ...(invoices as Invoices[]),
            // Let say an other was created manually
            {
              type: "invoices",
              state: "draft",
              emit_date: new Date("2024-01-31T23:00:00.000Z"),
              from_subscription: {
                from: new Date("2024-01-31T23:00:00.000Z"),
                to: new Date("2024-02-29T22:59:59.999Z"),
                frequency: "monthly",
              },
            } as Invoices,
          ],
        },
      },
      "Europe/Paris"
    );
    invoices = res.invoices;
    recheckAt = res.recheckAt;
    expect(recheckAt).toEqual(new Date("2024-02-29T23:00:00.000Z"));
    expect(invoices.length).toEqual(0);

    quote.subscription_next_invoice_date = recheckAt;

    res = getNewInvoicesAndNextDate(quote, existingInvoices, "Europe/Paris");
    invoices = res.invoices;
    recheckAt = res.recheckAt;

    expect(recheckAt).toEqual(new Date("2024-03-31T22:00:00.000Z")); // TODO : This value should be 2024-03-31 but days saving in france starts the 30/03, the system is almost perfect (invoice will be generated 1 day late)
    expect(invoices.length).toEqual(1);
    expect(invoices[0].content.length).toEqual(1);
    expect(invoices[0].from_subscription.frequency).toEqual("monthly");
    expect(invoices[0].emit_date).toEqual(new Date("2024-02-29T23:00:00.000Z"));
    expect(invoices[0].from_subscription.from).toEqual(
      new Date("2024-02-29T23:00:00.000Z")
    );
    expect(invoices[0].from_subscription.to).toEqual(
      new Date("2024-03-31T22:59:59.999Z")
    );
  });
});
