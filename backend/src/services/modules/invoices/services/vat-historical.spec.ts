import { describe, expect, test } from "@jest/globals";
import { deprecatedVatCodes, getVatCode } from "@shared/consts";
import { computePricesFromInvoice, getTvaValue } from "@shared/invoices";
import Invoices from "../entities/invoices";

const line = (unit_price: number, tva: string) =>
  ({
    type: "product",
    name: "Ligne",
    quantity: 1,
    unit_price,
    tva,
    discount: { mode: "amount", value: 0 },
  } as any);

describe("Former standard VAT rate 19.6% (until 31/12/2013)", () => {
  test("is computed on historical documents", () => {
    const total = computePricesFromInvoice({
      content: [line(100, "S:19.6")],
      discount: { mode: "amount", value: 0 },
    } as Pick<Invoices, "content" | "discount">);

    expect(total.total).toBe(100);
    expect(total.taxes).toBeCloseTo(19.6, 2);
    expect(total.total_with_taxes).toBeCloseTo(119.6, 2);
  });

  test("is kept apart from 20% in the VAT breakdown", () => {
    const total = computePricesFromInvoice({
      content: [line(100, "S:19.6"), line(50, "S:20")],
      discount: { mode: "amount", value: 0 },
    } as Pick<Invoices, "content" | "discount">);

    expect(total.taxes).toBeCloseTo(29.6, 2);
    expect(total.total_with_taxes).toBeCloseTo(179.6, 2);
  });

  test("getTvaValue and getVatCode know the code", () => {
    expect(getTvaValue("S:19.6")).toBeCloseTo(0.196, 5);
    expect(getVatCode("S:19.6")).toBe("S:19.6");
    // Rate received from an incoming e-invoice
    expect(getVatCode("19.6")).toBe("S:19.6");
    expect(getVatCode("19.60")).toBe("S:19.6");
    // Other rates are unchanged
    expect(getVatCode("20")).toBe("S:20");
  });

  test("is flagged as deprecated (not offered for new lines)", () => {
    expect(deprecatedVatCodes).toContain("S:19.6");
  });
});
