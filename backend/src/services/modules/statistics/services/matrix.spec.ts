import { describe, expect, test } from "@jest/globals";
import { getInvoiceLinesAmounts, getMonthBounds } from "./matrix";

describe("Statistics matrix", () => {
  test("getMonthBounds", async () => {
    const bounds = (month: string) => {
      const { from, to } = getMonthBounds(month, "Europe/Paris");
      return [new Date(from).toISOString(), new Date(to).toISOString()];
    };

    expect(bounds("2026-02")).toEqual([
      "2026-01-31T23:00:00.000Z",
      "2026-02-28T23:00:00.000Z",
    ]);
    // DST change during the month: must end on April 1st at 00:00 (Paris)
    expect(bounds("2026-03")).toEqual([
      "2026-02-28T23:00:00.000Z",
      "2026-03-31T22:00:00.000Z",
    ]);
    expect(bounds("2026-04")).toEqual([
      "2026-03-31T22:00:00.000Z",
      "2026-04-30T22:00:00.000Z",
    ]);
    expect(bounds("2026-10")).toEqual([
      "2026-09-30T22:00:00.000Z",
      "2026-10-31T23:00:00.000Z",
    ]);
  });

  test("getInvoiceLinesAmounts", async () => {
    // Down payment deduction (line without article) is kept
    expect(
      getInvoiceLinesAmounts({
        content: [
          { article: "a1", unit_price: 1000, quantity: 2 },
          { article: "", unit_price: -500, quantity: 1 },
        ] as any,
        total: { total: 1500 } as any,
      })
    ).toEqual([
      { article: "a1", amount: 2000 },
      { article: null, amount: -500 },
    ]);

    // Line discount, global discount and unchecked optional line
    const lines = getInvoiceLinesAmounts({
      content: [
        {
          article: "a1",
          unit_price: 100,
          quantity: 2,
          discount: { mode: "percentage", value: 50 },
        },
        { article: "a2", unit_price: 300, quantity: 1 },
        { article: "a3", unit_price: 1000, quantity: 1, optional: true },
      ] as any,
      total: { total: 360 } as any, // 100 + 300 - 10% global discount
    });
    expect(lines.map((a) => a.article)).toEqual(["a1", "a2"]);
    expect(lines[0].amount).toBeCloseTo(90);
    expect(lines[1].amount).toBeCloseTo(270);
  });
});
