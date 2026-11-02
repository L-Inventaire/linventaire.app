import { describe, expect, test } from "@jest/globals";
import { computePricesFromInvoice } from "@shared/invoices";
import { getAccountingExportLinesAmounts } from "./accounting-export-lines";

const line = (data: any) => ({
  type: "product",
  quantity: 1,
  unit_price: 0,
  tva: "S:20",
  optional: false,
  optional_checked: false,
  ...data,
});

const withTotal = (invoice: any) => ({
  ...invoice,
  total: computePricesFromInvoice(invoice),
});

const sum = (values: number[]) =>
  Math.round(values.reduce((s, v) => s + v * 100, 0)) / 100;

describe("Accounting export lines", () => {
  test("uses the article account, then the company default, then the PCG", () => {
    const invoice = withTotal({
      type: "invoices",
      content: [
        line({ article: "a1", unit_price: 100 }),
        line({ type: "service", unit_price: 50 }),
        line({ type: "product", unit_price: 10 }),
      ],
    });
    const articles = {
      a1: {
        id: "a1",
        type: "product",
        accounting: {
          sell: { standard_identifier: "7071", standard: "pcg", name: "Mat" },
          buy: { standard_identifier: "", standard: "pcg", name: "" },
        },
      },
    } as any;

    const lines = getAccountingExportLinesAmounts(invoice, articles, {
      sell: {
        service: {
          standard_identifier: "7061",
          standard: "pcg",
          name: "Presta",
        },
      } as any,
    });

    expect(lines.map((l) => l.accounting.number)).toEqual([
      "7071",
      "7061",
      "707",
    ]);
    expect(lines.map((l) => l.accounting.is_default)).toEqual([
      false,
      true,
      true,
    ]);
    expect(lines.map((l) => l.vat_accounting.number)).toEqual([
      "44571",
      "44571",
      "44571",
    ]);
    expect(lines.map((l) => l.line_tva_amount)).toEqual([20, 10, 2]);
  });

  test("supplier documents use buy and deductible VAT accounts", () => {
    const invoice = withTotal({
      type: "supplier_invoices",
      content: [
        line({ type: "consumable", unit_price: 10, tva: "S:10" }),
        line({ type: "service", unit_price: 10, tva: "K:VATEX-EU-IC" }),
      ],
    });
    const lines = getAccountingExportLinesAmounts(
      invoice,
      {},
      {
        vat_deductible: {
          default: { standard_identifier: "44566", standard: "pcg", name: "" },
          rates: {
            "S:10": {
              standard_identifier: "445662",
              standard: "pcg",
              name: "",
            },
          },
        },
      },
    );
    expect(lines.map((l) => l.accounting.number)).toEqual(["6022", "604"]);
    // No VAT, no VAT account
    expect(lines.map((l) => l.vat_accounting.number)).toEqual(["445662", ""]);
  });

  test("spreads the global discount and the VAT so lines sum to the totals", () => {
    const invoice = withTotal({
      type: "invoices",
      discount: { mode: "percentage", value: 7 },
      content: [
        line({ unit_price: 33.33, quantity: 3 }),
        line({
          unit_price: 19.99,
          quantity: 7,
          discount: { mode: "percentage", value: 3 },
        }),
        line({ unit_price: 12.5, tva: "S:5.5" }),
        line({ unit_price: 1.01, tva: "S:5.5" }),
        line({ type: "separation" }),
        line({ unit_price: 1000, optional: true, optional_checked: false }),
      ],
    });

    const lines = getAccountingExportLinesAmounts(invoice, {}, {});

    expect(lines.length).toBe(4);
    expect(sum(lines.map((l) => l.line_total_ht))).toBe(invoice.total.total);
    expect(sum(lines.map((l) => l.line_tva_amount))).toBe(invoice.total.taxes);
    expect(sum(lines.map((l) => l.line_total_ttc))).toBe(
      invoice.total.total_with_taxes,
    );
    expect(sum(lines.map((l) => l.line_global_discount))).toBe(
      sum(invoice.total.allowances_breakdown.map((a: any) => a.amount)),
    );
    for (const l of lines) {
      expect(l.line_total_ht).toBe(
        sum([l.line_total_before_global_discount, -l.line_global_discount]),
      );
    }
  });

  test("recomputes the totals of old documents without discount breakdown", () => {
    const invoice = {
      type: "invoices",
      discount: { mode: "amount", value: 10 },
      content: [line({ unit_price: 60 }), line({ unit_price: 40 })],
      total: { total: 90, taxes: 18, total_with_taxes: 108 },
    } as any;
    const lines = getAccountingExportLinesAmounts(invoice, {}, {});
    expect(lines.map((l) => l.line_global_discount)).toEqual([6, 4]);
    expect(lines.map((l) => l.line_total_ht)).toEqual([54, 36]);
    expect(lines.map((l) => l.line_tva_amount)).toEqual([10.8, 7.2]);
  });
});
