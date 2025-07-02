import { describe, expect, test } from "@jest/globals";
import { computePartialInvoice } from "./compute-partial-invoice";
import Invoices, { InvoiceLine } from "../entities/invoices";
import { computePricesFromInvoice } from "../utils";

describe("Compute partial invoices", () => {
  test("Check simple case", async () => {
    const result = computePartialInvoice(
      {
        type: "quotes",
        content: [
          {
            article: "computer",
            quantity: 10,
            unit_price: 100,
            discount: { mode: "amount", value: 0 },
          },
        ],
        discount: { mode: "amount", value: 0 },
      } as unknown as Invoices,
      [] as Invoices[],
      [] as InvoiceLine[]
    );

    expect(result.invoiced.content.length).toBe(0);
    expect(result.partial_invoice.content.length).toBe(1);
    expect(result.remaining.content.length).toBe(0);
  });

  test("Check completion simple case", async () => {
    const result = computePartialInvoice(
      {
        type: "quotes",
        content: [
          {
            article: "computer",
            quantity: 10,
            unit_price: 100,
            discount: { mode: "amount", value: 0 },
          },
        ],
        discount: { mode: "amount", value: 10 },
      } as unknown as Invoices,
      [
        {
          type: "invoices",
          content: [
            {
              article: "computer",
              quantity: 5,
              unit_price: 100,
              discount: { mode: "amount", value: 0 },
            },
          ],
          discount: { mode: "amount", value: 5 },
        } as unknown as Invoices,
      ] as Invoices[],
      [] as InvoiceLine[]
    );

    expect(result.invoiced.content.length).toBe(1);
    expect(result.partial_invoice.content.length).toBe(1);
    expect(result.remaining.content.length).toBe(0);

    expect(result.invoiced.discount.value).toBe(5);
    expect(result.partial_invoice.discount.value).toBe(5);
    expect(result.remaining.discount.value).toBe(0);
  });

  test("Check bad partial invoices", async () => {
    const quote = {
      type: "quotes",
      content: [
        {
          article: "computer",
          quantity: 10,
          unit_price: 100,
          discount: { mode: "amount", value: 0 },
        },
      ],
      discount: { mode: "amount", value: 10 },
    } as unknown as Invoices;
    const result = computePartialInvoice(
      quote,
      [
        {
          type: "invoices",
          content: [
            {
              article: "computer",
              quantity: 2,
              unit_price: 110,
              discount: { mode: "amount", value: 0 },
            },
          ],
          discount: { mode: "amount", value: 0 },
        } as unknown as Invoices,
        {
          type: "invoices",
          content: [
            {
              article: "computer",
              quantity: 6,
              unit_price: 100,
              discount: { mode: "amount", value: 0 },
            },
          ],
          discount: { mode: "amount", value: 10 },
        } as unknown as Invoices,
      ] as Invoices[],
      [] as InvoiceLine[]
    );

    expect(result.invoiced.content.length).toBe(2);
    expect(
      result.invoiced.content[0].quantity + result.invoiced.content[1].quantity
    ).toBe(8);
    expect(result.invoiced.discount.value).toBe(10);

    expect(result.partial_invoice.content.length).toBe(1);
    expect(result.partial_invoice.content[0].quantity).toBe(2);
    expect(result.partial_invoice.discount.value).toBe(20);

    expect(result.remaining.content.length).toBe(0);
    expect(result.remaining.discount.value).toBe(0);

    expect(
      computePricesFromInvoice(result.partial_invoice).total +
        computePricesFromInvoice(result.remaining).total +
        computePricesFromInvoice(result.invoiced).total
    ).toBe(computePricesFromInvoice(quote).total);
  });

  test("Check overinvoiced cases", async () => {
    const quote = {
      type: "quotes",
      content: [
        {
          article: "computer",
          quantity: 10,
          unit_price: 100,
          discount: { mode: "amount", value: 0 },
        },
      ],
      discount: { mode: "amount", value: 10 },
    } as unknown as Invoices;
    const result = computePartialInvoice(
      quote,
      [
        {
          type: "invoices",
          content: [
            {
              article: "computer",
              quantity: 2,
              unit_price: 4000,
              discount: { mode: "amount", value: 0 },
            },
          ],
          discount: { mode: "amount", value: 0 },
        } as unknown as Invoices,
        {
          type: "invoices",
          content: [
            {
              article: "computer",
              quantity: 6,
              unit_price: 1000,
              discount: { mode: "amount", value: 0 },
            },
          ],
          discount: { mode: "amount", value: 10 },
        } as unknown as Invoices,
      ] as Invoices[],
      [] as InvoiceLine[]
    );

    expect(result.partial_invoice.type).toBe("credit_notes");
    expect(result.partial_invoice.content.length).toBe(1);
    expect(result.partial_invoice.content[0].quantity).toBe(1);
    expect(result.partial_invoice.content[0].unit_price).toBe(13200);
    expect(result.partial_invoice.discount.value).toBe(0);
  });

  test("Check bad partial invoices and selected items", async () => {
    const quote = {
      type: "quotes",
      content: [
        {
          article: "computer",
          quantity: 10,
          unit_price: 1000,
          discount: { mode: "amount", value: 100 },
        },
        {
          article: "table",
          quantity: 5,
          unit_price: 500,
          discount: { mode: "amount", value: 0 },
        },
      ],
      discount: { mode: "percentage", value: 10 }, // 10% off
    } as unknown as Invoices;
    const initialInvoices = [
      {
        type: "invoices",
        content: [
          {
            article: "computer",
            quantity: 2,
            unit_price: 110,
            discount: { mode: "amount", value: 0 },
          },
        ],
        discount: { mode: "amount", value: 0 },
      } as unknown as Invoices,
      {
        type: "invoices",
        content: [
          {
            article: "computer",
            quantity: 6,
            unit_price: 100,
            discount: { mode: "amount", value: 0 },
          },
        ],
        discount: { mode: "amount", value: 10 },
      } as unknown as Invoices,
    ];
    const result = computePartialInvoice(
      quote,
      initialInvoices as Invoices[],
      [
        {
          article: "table",
          quantity: 2,
        },
      ] as InvoiceLine[]
    );

    expect(result.invoiced.content.length).toBe(2);
    expect(
      result.invoiced.content[0].quantity + result.invoiced.content[1].quantity
    ).toBe(8);
    expect(result.invoiced.discount.value).toBe(10);

    expect(result.partial_invoice.content.length).toBe(1);
    expect(result.partial_invoice.content[0].quantity).toBe(2);
    expect(result.partial_invoice.discount.value).toBe(100);

    expect(result.remaining.content.length).toBe(2);
    expect(
      result.remaining.content.find((a) => a.article === "computer").quantity
    ).toBe(2);
    expect(
      result.remaining.content.find((a) => a.article === "table").quantity
    ).toBe(3);
    expect(result.remaining.discount.value).toBe(
      computePricesFromInvoice(quote).discount - 10 - 100
    );

    // At this time the remaining invoice can be wrong, now we'll emulate the automated process when invoice in completed

    const result2 = computePartialInvoice(
      quote,
      [...initialInvoices, result.partial_invoice] as Invoices[],
      [] as InvoiceLine[]
    );

    // For this specific case we have under-invoiced everything (100€ instead of 1000€ for computers)
    // So an additional line will be created in the final invoice

    expect(
      computePricesFromInvoice(result2.partial_invoice).total +
        computePricesFromInvoice(result2.remaining).total +
        computePricesFromInvoice(result2.invoiced).total
    ).toBe(computePricesFromInvoice(quote).total);
  });

  test("Check existing credit notes cases", async () => {
    const quote = {
      type: "quotes",
      content: [
        {
          article: "computer",
          quantity: 10,
          unit_price: 1000,
          discount: { mode: "amount", value: 0 },
        },
      ],
      discount: { mode: "amount", value: 10 },
    } as unknown as Invoices;
    const result = computePartialInvoice(
      quote,
      [
        {
          type: "invoices",
          content: [
            {
              article: "computer",
              quantity: 2,
              unit_price: 1000,
              discount: { mode: "amount", value: 0 },
            },
          ],
          discount: { mode: "amount", value: 0 },
        } as unknown as Invoices,
        {
          type: "invoices",
          content: [
            {
              article: "computer",
              quantity: 6,
              unit_price: 1000,
              discount: { mode: "amount", value: 0 },
            },
          ],
          discount: { mode: "amount", value: 10 },
        } as unknown as Invoices,
        {
          type: "credit_notes",
          content: [
            {
              article: "computer",
              quantity: 2,
              unit_price: 1000,
              discount: { mode: "amount", value: 0 },
            },
          ],
          discount: { mode: "amount", value: 0 },
        } as unknown as Invoices,
      ] as Invoices[],
      [] as InvoiceLine[]
    );

    expect(result.partial_invoice.type).toBe("invoices");
    expect(result.partial_invoice.content.length).toBe(1);
    expect(result.partial_invoice.content[0].quantity).toBe(4);
    expect(result.partial_invoice.content[0].unit_price).toBe(1000);
    expect(result.partial_invoice.discount.value).toBe(0);
  });

  test("Check down deposit case", async () => {
    const result = computePartialInvoice(
      // Quote
      {
        type: "quotes",
        content: [
          {
            article: "computer",
            quantity: 10,
            unit_price: 100,
            discount: { mode: "amount", value: 0 },
          },
        ],
        discount: { mode: "amount", value: 0 },
      } as unknown as Invoices,

      // Already existing invoices
      [] as Invoices[],

      // Invoice I'm going to create
      [
        {
          type: "correction",
          quantity: 1,
          unit_price: 750,
        },
      ] as InvoiceLine[]
    );

    expect(result.partial_invoice.total.total_with_taxes).toBe(750);
    expect(result.remaining.total.total_with_taxes).toBe(250);
  });

  test("Check historic down deposit case", async () => {
    const result = computePartialInvoice(
      // Quote
      {
        type: "quotes",
        content: [
          {
            article: "computer",
            quantity: 10,
            unit_price: 100,
            discount: { mode: "amount", value: 0 },
          },
        ],
        discount: { mode: "amount", value: 0 },
      } as unknown as Invoices,

      // Already existing invoices
      [
        {
          type: "invoices",
          content: [
            {
              type: "correction",
              quantity: 1,
              unit_price: 750,
            },
          ],
          discount: { mode: "amount", value: 0 },
        },
      ] as Invoices[],

      // Use all remaining stuff
      [] as InvoiceLine[]
    );

    expect(result.partial_invoice.total.total_with_taxes).toBe(250);
    expect(
      result.partial_invoice.content.find(
        (a) => a.type === "correction" && a.unit_price === -750
      )
    ).toBeDefined();
    expect(result.remaining.total.total_with_taxes).toBe(0);
  });
});
