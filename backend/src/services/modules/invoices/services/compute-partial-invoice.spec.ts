import { describe, expect, test } from "@jest/globals";
import { computePartialInvoice } from "./compute-partial-invoice";
import Invoices, { InvoiceLine } from "../entities/invoices";
import { computePricesFromInvoice } from "../utils";
import _ from "lodash";

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

    expect(result.remaining_credit_note).toBe(undefined);
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

    console.log("result.here.invoiced", result.invoiced);
    console.log("result.here.partial_invoice", result.partial_invoice);
    console.log("result.here.remaining", result.remaining);
    console.log(
      "result.here.remaining_credit_note",
      result.remaining_credit_note
    );

    expect(result.invoiced.content.length).toBe(1);
    expect(result.partial_invoice.content.length).toBe(1);
    expect(result.remaining.content.length).toBe(0);

    expect(result.invoiced.discount.value).toBe(5);
    expect(result.partial_invoice.discount.value).toBe(5);
    expect(result.remaining.discount.value).toBe(0);

    expect(result.remaining_credit_note).toBe(undefined);
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

    expect(result.partial_invoice.content.length).toBe(2);
    expect(result.partial_invoice.content[0].quantity).toBe(2);
    expect(result.partial_invoice.content[1].unit_price).toBe(-20);
    expect(result.partial_invoice.discount.value).toBe(0);

    expect(result.remaining.content.length).toBe(0);
    expect(result.remaining.discount.value).toBe(0);

    expect(
      computePricesFromInvoice(result.partial_invoice).total +
        computePricesFromInvoice(result.remaining).total +
        computePricesFromInvoice(result.invoiced).total
    ).toBe(computePricesFromInvoice(quote).total);

    expect(result.remaining_credit_note).toBe(undefined);
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
    // Expected total: (100*10) - 10 = 990

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
    // Already paid: 2*4000 + 6*1000 - 10 = 8000 + 6000 - 10 = 13990

    // Here we want the final invoice, everything was over invoiced,

    console.log("result.here.invoiced", result.invoiced);
    console.log("result.here.partial_invoice", result.partial_invoice);
    console.log("result.here.remaining", result.remaining);
    console.log(
      "result.here.remaining_credit_note",
      result.remaining_credit_note
    );

    expect(result.partial_invoice.type).toBe("invoices");
    expect(result.partial_invoice.content.length).toBe(2);
    expect(result.partial_invoice.content[0].quantity).toBe(2); // 2 computers remaining
    expect(result.partial_invoice.content[0].unit_price).toBe(100);
    expect(result.partial_invoice.content[1].unit_price).toBe(-200);
    expect(result.partial_invoice.discount.value).toBe(0);
    expect(result.partial_invoice.total.total_with_taxes).toBe(0);
    expect(result.remaining_credit_note.type).toBe("credit_notes");
    expect(result.remaining_credit_note.total.total_with_taxes).toBe(13000);
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
    // Expected total: (1000*10-100 + 500*5) - 10% = (10000 - 100 + 2500) - 10% = 12 400 - 1 240 = 11 160
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
    // Already paid: 2*110 + 6*100 - 10 = 220 + 600-10 = 810
    const result = _.cloneDeep(
      computePartialInvoice(
        quote,
        initialInvoices as Invoices[],
        [
          {
            article: "table",
            quantity: 2,
          },
        ] as InvoiceLine[]
      )
    );
    // Expected new invoice: 2*500 - 10% = 1000 - 100 = 900 (takes default discount is not specified)

    // Remaining: 11160 - 810 - 900 = 9 450

    console.log("result.here.invoiced", result.invoiced);
    console.log("result.here.partial_invoice", result.partial_invoice);
    console.log("result.here.remaining", result.remaining);
    console.log(
      "result.here.remaining_credit_note",
      result.remaining_credit_note
    );

    expect(result.invoiced.content.length).toBe(2);
    expect(
      result.invoiced.content[0].quantity + result.invoiced.content[1].quantity
    ).toBe(8);
    expect(result.invoiced.discount.value).toBe(10);

    expect(result.partial_invoice.content.length).toBe(1);
    expect(result.partial_invoice.content[0].quantity).toBe(2);
    expect(result.partial_invoice.discount.value).toBe(100);

    expect(result.remaining.content.length).toBe(3);
    expect(
      result.remaining.content.find((a) => a.article === "computer").quantity
    ).toBe(2);
    expect(
      result.remaining.content.find((a) => a.article === "table").quantity
    ).toBe(3);
    expect(
      result.remaining.content.find((a) => a.type === "correction").unit_price
    ).toBe(5950);
    expect(result.remaining.discount.value).toBe(0);
    expect(result.remaining.total.total_with_taxes).toBe(9450);

    // At this time the remaining invoice can be wrong, now we'll emulate the automated process when invoice in completed

    expect(
      computePricesFromInvoice(result.partial_invoice).total_with_taxes +
        computePricesFromInvoice(result.remaining).total_with_taxes +
        computePricesFromInvoice(result.invoiced).total_with_taxes
    ).toBe(computePricesFromInvoice(quote).total_with_taxes);

    const result2 = computePartialInvoice(
      quote,
      [...initialInvoices, result.partial_invoice] as Invoices[],
      [] as InvoiceLine[]
    );

    console.log("result2.here.invoiced", result2.invoiced);
    console.log("result2.here.partial_invoice", result2.partial_invoice);
    console.log("result2.here.remaining", result2.remaining);
    console.log(
      "result2.here.remaining_credit_note",
      result2.remaining_credit_note
    );

    // For this specific case we have under-invoiced everything (100€ instead of 1000€ for computers)
    // So an additional line will be created in the final invoice

    expect(
      computePricesFromInvoice(result2.partial_invoice).total_with_taxes +
        computePricesFromInvoice(result2.remaining).total_with_taxes +
        computePricesFromInvoice(result2.invoiced).total_with_taxes
    ).toBe(computePricesFromInvoice(quote).total_with_taxes);
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
    expect(result.remaining_credit_note).toBe(undefined);
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
    expect(result.remaining_credit_note).toBe(undefined);
  });
});
