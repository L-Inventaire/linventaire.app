import { describe, expect, test } from "@jest/globals";
import Clients from "#src/services/clients/entities/clients";
import Contacts from "../../contacts/entities/contacts";
import Articles from "../../articles/entities/articles";
import Invoices from "../../invoices/entities/invoices";
import { computePricesFromInvoice } from "@shared/invoices";
import fs from "fs";
import path from "path";
import {
  buildPaymentInstructions,
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

describe("convertInternalToEN16931 - EN16931 business rules", () => {
  const decimals = (v?: string) => (v?.split(".")[1] || "").length;

  test("amounts have at most 2 decimals (BR-DEC-20)", () => {
    const result = convertInternalToEN16931(
      buildInvoice({
        vat_breakdown: [
          // Floating point noise coming from the internal computation
          { tva: "20", taxable_amount: 82.00000000000001, tax_amount: 16.400000000000002 },
        ],
      }),
      buildResolvedEntities()
    );

    for (const vb of result.vat_break_down) {
      expect(decimals(vb.vat_category_taxable_amount)).toBeLessThanOrEqual(2);
      expect(decimals(vb.vat_category_tax_amount)).toBeLessThanOrEqual(2);
    }
    expect(decimals(result.totals.total_without_vat)).toBeLessThanOrEqual(2);
    expect(decimals(result.totals.total_vat_amount?.value)).toBeLessThanOrEqual(2);
  });

  test("total with VAT = total without VAT + total VAT (BR-CO-15)", () => {
    const result = convertInternalToEN16931(
      buildInvoice({
        // Internal total rounded differently from the VAT breakdown
        total_with_taxes: 98.41,
        vat_breakdown: [{ tva: "20", taxable_amount: 82, tax_amount: 16.4 }],
      }),
      buildResolvedEntities()
    );

    expect(result.totals.total_with_vat).toBe("98.4");
    expect(result.totals.amount_due_for_payment).toBe("98.4");
  });

  test("total VAT is in the invoice currency (BR-CO-15)", () => {
    const result = convertInternalToEN16931(
      {
        ...buildInvoice({
          vat_breakdown: [{ tva: "20", taxable_amount: 82, tax_amount: 16.4 }],
        }),
        currency: "chf",
      } as Invoices,
      buildResolvedEntities()
    );

    // BR-CO-15 ignores a VAT total whose currencyID is not the invoice currency
    expect(result.currency_code).toBe("CHF");
    expect(result.totals.total_vat_amount).toEqual({
      value: "16.4",
      currency_code: "CHF",
    });
  });

  test("seller SIREN is 9 digits even when a SIRET is stored (BR-FR-10)", () => {
    const result = convertInternalToEN16931(
      buildInvoice({
        vat_breakdown: [{ tva: "20", taxable_amount: 82, tax_amount: 16.4 }],
      }),
      buildResolvedEntities()
    );

    expect(result.seller.legal_registration_identifier?.value).toBe("527830681");
  });
});

describe("convertInternalToEN16931 - same totals as the PDF", () => {
  test("e-invoice totals equal computePricesFromInvoice totals", () => {
    const invoice = buildInvoice({});
    invoice.content = [
      { article: "article-1", name: "A", quantity: 3, unit_price: 12.33333, tva: "20", discount: { mode: "percentage", value: 7.5 } },
      { article: "", type: "separation", name: "Section", quantity: 0, unit_price: 0, tva: "", discount: { mode: "amount", value: 0 } },
      { article: "article-1", name: "B", quantity: 7, unit_price: 1.005, tva: "5.5", discount: { mode: "amount", value: 0.37 } },
      { article: "article-1", name: "C", quantity: 1, unit_price: 99, tva: "20", optional: true, optional_checked: false, discount: { mode: "amount", value: 0 } },
      { article: "", type: "correction", name: "Remise", quantity: 1, unit_price: -2.1, tva: "20", discount: { mode: "amount", value: 0 } },
    ] as any;
    invoice.discount = { mode: "percentage", value: 3.33 } as any;
    invoice.total = computePricesFromInvoice(invoice);

    const result = convertInternalToEN16931(invoice, buildResolvedEntities());
    const t = result.totals;

    // Same totals as the PDF
    expect(parseFloat(t.total_without_vat)).toBe(invoice.total!.total);
    expect(parseFloat(t.total_vat_amount!.value)).toBe(invoice.total!.taxes);
    expect(parseFloat(t.total_with_vat)).toBe(invoice.total!.total_with_taxes);

    // EN16931 consistency
    const lines = result.lines.reduce((s, l) => s + parseFloat(l.net_amount), 0);
    const allowances = parseFloat(t.sum_allowances_amount || "0");
    expect(Math.round((lines - allowances) * 100)).toBe(Math.round(parseFloat(t.total_without_vat) * 100)); // BR-CO-13
    expect(Math.round(lines * 100)).toBe(Math.round(parseFloat(t.sum_invoice_lines_amount) * 100)); // BR-CO-10
    for (const vb of result.vat_break_down) {
      const expected = Math.round(parseFloat(vb.vat_category_taxable_amount) * parseFloat(vb.vat_category_rate));
      expect(Math.round(parseFloat(vb.vat_category_tax_amount) * 100)).toBe(expected); // BR-CO-17
    }
    expect(result.lines).toHaveLength(2); // No separator, no unchecked option, rebate as allowance
  });
});

describe("convertInternalToEN16931 dates", () => {
  test("dates are formatted in the company timezone", () => {
    const invoice = {
      ...buildInvoice({
        vat_breakdown: [{ tva: "20", taxable_amount: 82, tax_amount: 16.4 }],
      }),
      // 2026-03-01 00:00 in Europe/Paris
      emit_date: new Date("2026-02-28T23:00:00.000Z").getTime(),
      payment_information: {
        mode: "",
        // 2026-04-01 00:00 in Europe/Paris (summer time)
        computed_date: new Date("2026-03-31T22:00:00.000Z").getTime(),
      },
      from_subscription: {
        frequency: "monthly",
        from: new Date("2026-02-28T23:00:00.000Z").getTime(),
        to: new Date("2026-03-31T21:59:59.999Z").getTime(),
      },
      delivery_date: new Date("2026-02-28T23:00:00.000Z").getTime(),
      delivery_address: {},
    } as unknown as Invoices;

    const result = convertInternalToEN16931(invoice, buildResolvedEntities());

    expect(result.issue_date).toBe("2026-03-01");
    expect(result.payment_due_date).toBe("2026-04-01");
    expect(result.invoicing_period).toEqual({
      start_date: "2026-03-01",
      end_date: "2026-03-31",
    });
    expect(result.delivery_information?.delivery_date).toBe(
      "2026-03-01"
    );
  });
});

/**
 * Regression test for "[PEPPOL-EN16931-R008]-Document MUST not contain empty
 * elements" on ApplicableHeaderTradeDelivery when no delivery date is set.
 */
describe("convertInternalToEN16931 delivery information", () => {
  test("falls back to the issue date when no delivery date is set", () => {
    const invoice = {
      ...buildInvoice({
        vat_breakdown: [{ tva: "20", taxable_amount: 82, tax_amount: 16.4 }],
      }),
      delivery_date: null,
    } as unknown as Invoices;

    const result = convertInternalToEN16931(invoice, buildResolvedEntities());

    expect(result.delivery_information?.delivery_date).toBe(
      "2025-06-30"
    );
  });

  test("uses the explicit delivery date when set", () => {
    const invoice = {
      ...buildInvoice({
        vat_breakdown: [{ tva: "20", taxable_amount: 82, tax_amount: 16.4 }],
      }),
      delivery_date: "2025-06-15",
    } as unknown as Invoices;

    const result = convertInternalToEN16931(invoice, buildResolvedEntities());

    expect(result.delivery_information?.delivery_date).toBe(
      "2025-06-15"
    );
  });
});

/**
 * SuperPDP silently ignores the keys it does not know: a misnamed field is
 * simply missing from the generated Factur-X (e.g. the delivery date, which
 * left ApplicableHeaderTradeDelivery empty: PEPPOL-EN16931-R008). Check the
 * converter output against the SuperPDP specification (schema `en_invoice`).
 */
describe("convertInternalToEN16931 matches the SuperPDP specification", () => {
  const spec = JSON.parse(
    fs.readFileSync(
      path.join(
        __dirname,
        "../../../../platform/e-invoices/adapters/superpdp/superpdp.json"
      ),
      "utf-8"
    )
  );
  const schemas = spec.components.schemas;

  const resolve = (schema: any): any => {
    while (schema?.$ref) schema = schemas[schema.$ref.split("/").pop()];
    return schema || {};
  };

  // Returns the list of the problems found (unknown keys, types...)
  const check = (value: any, schema: any, at: string): string[] => {
    schema = resolve(schema);
    if (Array.isArray(value)) {
      return value.flatMap((item, i) =>
        check(item, schema.items, `${at}[${i}]`)
      );
    }
    if (value && typeof value === "object") {
      const properties = schema.properties || {};
      return [
        ...(schema.required || [])
          .filter((key: string) => value[key] === undefined)
          .map((key: string) => `${at}.${key} is required`),
        ...Object.keys(value).flatMap((key) =>
          properties[key]
            ? check(value[key], properties[key], `${at}.${key}`)
            : [`${at}.${key} is not in the specification`]
        ),
      ];
    }
    if (schema.type === "string" && typeof value !== "string") {
      return [`${at} must be a string (got ${JSON.stringify(value)})`];
    }
    if (schema.type === "integer" && !Number.isInteger(value)) {
      return [`${at} must be an integer (got ${JSON.stringify(value)})`];
    }
    if (schema.enum && !schema.enum.includes(value)) {
      return [`${at} must be one of ${schema.enum.join(", ")}`];
    }
    return [];
  };

  test("every field of a complete invoice is known by SuperPDP", () => {
    const invoice = buildInvoice({});
    invoice.alt_reference = "PO-123";
    invoice.notes = "Merci pour votre confiance";
    invoice.content = [
      { article: "article-1", name: "A", reference: "REF-A", quantity: 3, unit_price: 12.5, tva: "20", discount: { mode: "percentage", value: 10 } },
      { article: "article-1", name: "B", quantity: 2, unit_price: 7, tva: "5.5", discount: { mode: "amount", value: 1 } },
      { article: "", type: "correction", name: "Remise", quantity: 1, unit_price: -2, tva: "20", discount: { mode: "amount", value: 0 } },
    ] as any;
    invoice.discount = { mode: "percentage", value: 5 } as any;
    invoice.total = computePricesFromInvoice(invoice);
    invoice.payment_information = {
      mode: ["bank_transfer"],
      delay: 30,
      delay_type: "direct",
      bank_iban: "FR76 1313 5000 8008 0028 5950 618",
      bank_bic: "CEPAFRPP313",
      computed_date: new Date("2025-07-30T00:00:00.000Z").getTime(),
    } as any;
    invoice.delivery_date = "2025-06-15" as any;
    invoice.delivery_address = {
      address_line_1: "87 Rue Gaston Doumergue",
      city: "Tournefeuille",
      zip: "31170",
      country: "",
    } as any;
    invoice.from_subscription = {
      frequency: "yearly",
      from: "2025-09-04T22:00:00.000Z",
      to: 1788472800000,
    } as any;

    const entities = buildResolvedEntities();
    entities.articles.set("article-1", {
      id: "article-1",
      name: "Service",
      supplier_reference: "SUP-1",
    } as unknown as Articles);

    const result = JSON.parse(
      JSON.stringify(convertInternalToEN16931(invoice, entities))
    );

    expect(check(result, { $ref: "#/components/schemas/en_invoice" }, "$")).toEqual([]);

    // The fields that used to be misnamed are really sent
    expect(result.delivery_information.delivery_date).toBe("2025-06-15");
    expect(result.deliver_to_address).toMatchObject({
      address_line1: "87 Rue Gaston Doumergue",
      country_code: "FR",
    });
    expect(result.payment_terms).toBe("Paiement à 30 jours.");
    expect(result.payment_instructions).toEqual({
      payment_means_type_code: "30",
      credit_transfers: [
        {
          payment_account_identifier: {
            value: "FR7613135000800800285950618",
            scheme: "IBAN",
          },
          payment_service_provider_identifier: "CEPAFRPP313",
        },
      ],
    });
    expect(result.lines[0].item_information.seller_identifier).toBe("REF-A");
    expect(result.lines[0].item_information.buyer_identifier).toBe("SUP-1");
    expect(result.lines[0].allowances[0]).toMatchObject({ percent: "10" });
  });
});

describe("buildPaymentInstructions", () => {
  test("a credit transfer needs an IBAN (BR-61)", () => {
    expect(
      buildPaymentInstructions({ mode: ["bank_transfer"], bank_iban: "" } as any)
    ).toBeUndefined();
  });

  test("a direct debit is not sent (no mandate reference)", () => {
    expect(
      buildPaymentInstructions({
        mode: ["direct_debit"],
        bank_iban: "FR7613135000800800285950618",
      } as any)
    ).toBeUndefined();
  });

  test("other modes are sent without account", () => {
    expect(
      buildPaymentInstructions({ mode: ["direct_debit", "check"] } as any)
    ).toEqual({ payment_means_type_code: "20" });
  });
});
