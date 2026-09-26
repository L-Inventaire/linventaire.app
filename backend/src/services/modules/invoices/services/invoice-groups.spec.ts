import { describe, expect, test } from "@jest/globals";
import {
  computeGroupTotal,
  computePricesFromInvoice,
  getGroupLines,
  normalizeInvoiceGroups,
} from "@shared/invoices";
import { InvoiceLine } from "../entities/invoices";

const line = (name: string, group = "", more: Partial<InvoiceLine> = {}) =>
  ({
    type: "product",
    name,
    group,
    quantity: 1,
    unit_price: 10,
    tva: "S:20",
    ...more,
  }) as InvoiceLine;

const header = (name: string, group: string, hidePrices = false) =>
  ({
    type: "group",
    name,
    group,
    group_hide_prices: hidePrices,
    quantity: 0,
    unit_price: 0,
  }) as InvoiceLine;

describe("Invoice groups", () => {
  test("Lines of a group are moved right after their header", () => {
    const content = normalizeInvoiceGroups([
      line("a", "g1"),
      header("G1", "g1"),
      line("b"),
      line("c", "g1"),
    ]);
    expect(content.map((a) => a.name)).toEqual(["G1", "a", "c", "b"]);
  });

  test("Lines referencing a missing group are detached", () => {
    const content = normalizeInvoiceGroups([line("a", "unknown"), line("b")]);
    expect(content.map((a) => [a.name, a.group])).toEqual([
      ["a", ""],
      ["b", ""],
    ]);
  });

  test("Group total applies discounts and ignores unchecked options", () => {
    const content = [
      header("G1", "g1"),
      line("a", "g1", { quantity: 2 }), // 20
      line("b", "g1", { discount: { mode: "percentage", value: 50 } }), // 5
      line("c", "g1", { optional: true, optional_checked: false }), // ignored
      line("d"), // Not in the group
    ];
    const total = computeGroupTotal(getGroupLines(content, "g1"));
    expect(total.total).toBe(25);
    expect(total.total_with_taxes).toBeCloseTo(30);
  });

  test("Group headers don't change the document total", () => {
    const content = [header("G1", "g1", true), line("a", "g1"), line("b")];
    expect(computePricesFromInvoice({ content } as any)?.initial).toBe(20);
  });
});
