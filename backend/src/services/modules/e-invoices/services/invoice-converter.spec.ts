import { describe, expect, test } from "@jest/globals";
import Clients from "#src/services/clients/entities/clients";
import Contacts from "../../contacts/entities/contacts";
import Articles from "../../articles/entities/articles";
import Invoices from "../../invoices/entities/invoices";
import {
  convertInternalToEN16931,
  ResolvedEntities,
} from "./invoice-converter";

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

const buildInvoice = (total: Partial<Invoices["total"]>): Invoices =>
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
        vat_breakdown: [{ tva: "20", taxable_amount: 82, tax_amount: 16.4 }],
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

/**
 * Regression test for the Factur-X conversion error
 * "[BR-27]-The Item net price (BT-146) shall NOT be negative".
 *
 * An invoice with "remise" (rebate) lines carrying a negative unit price used
 * to be emitted as invoice lines with a negative item net price, which the
 * EN16931 standard forbids. Such lines must instead be expressed as
 * document-level allowances.
 */
describe("convertInternalToEN16931 - negative rebate lines", () => {
  const buildEntities = (): ResolvedEntities => {
    const self = {
      company: {
        legal_name: "Proxima",
        name: "Proxima",
        tax_number: "FR35527830681",
        registration_number: "52783068100054",
      },
      address: {
        address_line_1: "44 AVENUE DU LAC",
        address_line_2: "",
        city: "FLOURENS",
        zip: "31130",
        country: "FR",
      },
      invoices: {},
    } as unknown as Clients;

    const client = {
      business_name: "BERGO Pâtisserie",
      business_registered_id: "795287549",
      address: {
        address_line_1: "87 Rue Gaston Doumergue",
        address_line_2: "",
        city: "Tournefeuille",
        zip: "31170",
        country: "FR",
      },
      invoices: {},
    } as unknown as Contacts;

    const articles = new Map<string, Articles>();
    articles.set("article-1", { type: "service" } as unknown as Articles);

    return { self, client, supplier: undefined, articles };
  };

  const buildInvoice = (): Invoices =>
    ({
      type: "invoices",
      reference: "FAC/2026/01042",
      name: "FAC/2026/01042",
      emit_date: new Date("2026-03-31"),
      currency: "EUR",
      format: {},
      payment_information: { mode: ["bank_transfer"] },
      // total is intentionally left undefined to exercise the recompute path
      content: [
        {
          article: "article-1",
          type: "service",
          name: "CONTRAT DE MAINTENANCE MENSUEL POSTE CLIENT (FIXE PARENTS)",
          quantity: 1,
          unit_price: 41.66,
          unit: "EA",
          tva: "S:20",
          discount: { mode: "amount", value: 0 },
        },
        {
          article: "article-1",
          type: "service",
          name: "CONTRAT DE MAINTENANCE MENSUEL POSTE CLIENT (PORT-TRAVAIL)",
          quantity: 1,
          unit_price: 41.66,
          unit: "EA",
          tva: "S:20",
          discount: { mode: "amount", value: 0 },
        },
        {
          article: "article-1",
          type: "service",
          name: "remise sur contrat PORT-TRAVAIL",
          quantity: 1,
          unit_price: -20.83,
          unit: "EA",
          tva: "S:20",
          discount: { mode: "amount", value: 0 },
        },
        {
          article: "article-1",
          type: "service",
          name: "CONTRAT DE MAINTENANCE MENSUEL POSTE CLIENT (FIXE ENFANT)",
          quantity: 1,
          unit_price: 41.66,
          unit: "EA",
          tva: "S:20",
          discount: { mode: "amount", value: 0 },
        },
        {
          article: "article-1",
          type: "service",
          name: "remise sur contrat FIXE-ENFANT",
          quantity: 1,
          unit_price: -41.66,
          unit: "EA",
          tva: "S:20",
          discount: { mode: "amount", value: 0 },
        },
      ],
      discount: { mode: "amount", value: 0 },
    } as unknown as Invoices);

  test("no invoice line has a negative item net price (BR-27)", () => {
    const result = convertInternalToEN16931(buildInvoice(), buildEntities());

    for (const line of result.lines) {
      expect(
        parseFloat(line.price_details.item_net_price)
      ).toBeGreaterThanOrEqual(0);
      expect(parseFloat(line.net_amount)).toBeGreaterThanOrEqual(0);
    }
  });

  test("rebate lines become document-level allowances", () => {
    const result = convertInternalToEN16931(buildInvoice(), buildEntities());

    // The three positive lines remain, the two rebate lines move to allowances
    expect(result.lines.length).toBe(3);

    const allowances = result.document_level_allowances || [];
    const allowancesTotal = allowances.reduce(
      (sum, a) => sum + parseFloat(a.amount),
      0
    );
    expect(allowancesTotal).toBeCloseTo(62.49, 2);
  });

  test("totals stay consistent (BR-CO-13) and VAT breakdown is present (BG-23)", () => {
    const result = convertInternalToEN16931(buildInvoice(), buildEntities());

    const sumLines = parseFloat(result.totals.sum_invoice_lines_amount);
    const sumAllowances = parseFloat(result.totals.sum_allowances_amount || "0");
    const totalWithoutVat = parseFloat(result.totals.total_without_vat);

    // BT-109 = BT-106 - BT-107 (+ BT-108, which is 0 here)
    expect(sumLines - sumAllowances).toBeCloseTo(totalWithoutVat, 2);
    expect(totalWithoutVat).toBeCloseTo(62.49, 2);
    expect(parseFloat(result.totals.total_with_vat)).toBeCloseTo(74.99, 2);

    // At least one VAT breakdown group is required by EN16931 (BG-23)
    expect(result.vat_break_down.length).toBeGreaterThan(0);
  });
});
