import { describe, expect, test } from "@jest/globals";
import { convertInternalToEN16931, ResolvedEntities } from "./invoice-converter";
import Invoices from "../../invoices/entities/invoices";
import Clients from "#src/services/clients/entities/clients";
import Contacts from "../../contacts/entities/contacts";
import Articles from "../../articles/entities/articles";

const buildResolvedEntities = (): ResolvedEntities => {
  const self = {
    company: {
      name: "Proxima",
      legal_name: "Proxima",
      tax_number: "FR35527830681",
      registration_number: "52783068100054",
    },
    address: {
      address_line_1: "44 AVENUE DU LAC",
      city: "FLOURENS",
      zip: "31130",
      country: "FR",
    },
    invoices: {},
  } as unknown as Clients;

  const client = {
    id: "client-1",
    business_name: "AGS NICE COTE D'AZUR",
    business_registered_id: "384037701",
    address: {
      address_line_1: "ZI LE BROC",
      city: "CARROS",
      zip: "06510",
      country: "FR",
    },
    invoices: {},
  } as unknown as Contacts;

  const articles = new Map<string, Articles>();
  articles.set("article-1", {
    id: "article-1",
    name: "Service",
  } as unknown as Articles);

  return { self, client, supplier: client, articles };
};

const buildInvoice = (
  total: Partial<Invoices["total"]>
): Invoices =>
  ({
    type: "invoices",
    reference: "FAC/2025/01846",
    name: "FAC/2025/01846",
    currency: "EUR",
    emit_date: "2025-06-30",
    payment_information: { mode: "" },
    content: [
      {
        article: "article-1",
        name: "Reset password",
        quantity: 1,
        unit_price: 82,
        tva: "20",
        discount: { mode: "amount", value: 0 },
      },
    ],
    total: {
      total: 82,
      total_with_taxes: 98.4,
      ...total,
    },
  } as unknown as Invoices);

describe("convertInternalToEN16931 VAT breakdown", () => {
  test("uses the precomputed VAT breakdown when available", () => {
    const result = convertInternalToEN16931(
      buildInvoice({
        vat_breakdown: [
          { tva: "20", taxable_amount: 82, tax_amount: 16.4 },
        ],
      }),
      buildResolvedEntities()
    );

    expect(result.vat_break_down).toHaveLength(1);
    expect(result.vat_break_down[0].vat_category_code).toBe("S");
    expect(result.vat_break_down[0].vat_category_rate).toBe("20");
    expect(result.vat_break_down[0].vat_category_taxable_amount).toBe("82");
    expect(result.vat_break_down[0].vat_category_tax_amount).toBe("16.4");
  });

  test("derives the VAT breakdown from lines when it is missing (BR-CO-18)", () => {
    const result = convertInternalToEN16931(
      buildInvoice({ vat_breakdown: undefined }),
      buildResolvedEntities()
    );

    // Must not be empty, otherwise Factur-X fails BR-CO-18 (BG-23).
    expect(result.vat_break_down.length).toBeGreaterThan(0);
    expect(result.vat_break_down[0].vat_category_code).toBe("S");
    expect(result.vat_break_down[0].vat_category_rate).toBe("20");
    expect(result.vat_break_down[0].vat_category_taxable_amount).toBe("82.00");
    expect(result.vat_break_down[0].vat_category_tax_amount).toBe("16.40");
    // Document totals stay consistent with the derived breakdown.
    expect(result.totals.total_without_vat).toBe("82");
    expect(result.totals.total_with_vat).toBe("98.4");
  });

  test("derives the VAT breakdown when the precomputed one is an empty array", () => {
    const result = convertInternalToEN16931(
      buildInvoice({ vat_breakdown: [] }),
      buildResolvedEntities()
    );

    expect(result.vat_break_down.length).toBeGreaterThan(0);
    expect(result.vat_break_down[0].vat_category_code).toBe("S");
    expect(result.vat_break_down[0].vat_category_rate).toBe("20");
  });
});
