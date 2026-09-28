import { describe, expect, test } from "@jest/globals";
import { computePricesFromInvoice } from "@shared/invoices";
import { EN16931Invoice } from "@shared/en16931-types";
import Clients from "#src/services/clients/entities/clients";
import Articles from "../../articles/entities/articles";
import Contacts from "../../contacts/entities/contacts";
import Invoices from "../../invoices/entities/invoices";
import {
  assertEN16931TotalsMatchPdf,
  EN16931TotalsMismatchError,
} from "./facturx-generator";
import {
  convertInternalToEN16931,
  ResolvedEntities,
} from "./invoice-converter";

const buildEN16931 = (totals: {
  total_without_vat: string;
  total_vat_amount?: string;
  total_with_vat: string;
}): EN16931Invoice =>
  ({
    totals: {
      sum_invoice_lines_amount: totals.total_without_vat,
      total_without_vat: totals.total_without_vat,
      total_vat_amount: totals.total_vat_amount
        ? { value: totals.total_vat_amount }
        : undefined,
      total_with_vat: totals.total_with_vat,
      amount_due_for_payment: totals.total_with_vat,
    },
  } as unknown as EN16931Invoice);

const pdfTotals = {
  initial: 100,
  discount: 0,
  total: 100,
  taxes: 20,
  total_with_taxes: 120,
} as Invoices["total"];

describe("assertEN16931TotalsMatchPdf", () => {
  test("passes when HT, TVA and TTC match the PDF", () => {
    expect(() =>
      assertEN16931TotalsMatchPdf(
        buildEN16931({
          total_without_vat: "100",
          total_vat_amount: "20",
          total_with_vat: "120",
        }),
        pdfTotals
      )
    ).not.toThrow();
  });

  test("ignores floating point noise below the cent", () => {
    expect(() =>
      assertEN16931TotalsMatchPdf(
        buildEN16931({
          total_without_vat: "100.00000000001",
          total_vat_amount: "19.999999999",
          total_with_vat: "120",
        }),
        pdfTotals
      )
    ).not.toThrow();
  });

  test("fails when the total without VAT (HT) differs", () => {
    let error: unknown;
    try {
      assertEN16931TotalsMatchPdf(
        buildEN16931({
          total_without_vat: "100.01",
          total_vat_amount: "20",
          total_with_vat: "120",
        }),
        pdfTotals
      );
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(EN16931TotalsMismatchError);
    expect((error as EN16931TotalsMismatchError).mismatches).toEqual([
      { field: "total_without_vat", pdf: 100, en16931: 100.01 },
    ]);
  });

  test("fails when the total with VAT (TTC) differs", () => {
    let error: unknown;
    try {
      assertEN16931TotalsMatchPdf(
        buildEN16931({
          total_without_vat: "100",
          total_vat_amount: "20",
          total_with_vat: "118",
        }),
        pdfTotals
      );
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(EN16931TotalsMismatchError);
    expect((error as EN16931TotalsMismatchError).mismatches).toEqual([
      { field: "total_with_vat", pdf: 120, en16931: 118 },
    ]);
  });

  test("fails when the VAT amount is missing from the EN16931 data", () => {
    expect(() =>
      assertEN16931TotalsMatchPdf(
        buildEN16931({ total_without_vat: "100", total_with_vat: "120" }),
        pdfTotals
      )
    ).toThrow(EN16931TotalsMismatchError);
  });
});

describe("assertEN16931TotalsMatchPdf with the real converter", () => {
  const entities = (): ResolvedEntities => {
    const client = {
      id: "client-1",
      business_name: "ACME",
      business_registered_id: "384037701",
      address: {
        address_line_1: "1 rue de la Paix",
        city: "Paris",
        zip: "75001",
        country: "FR",
      },
      invoices: {},
    } as unknown as Contacts;
    const articles = new Map<string, Articles>();
    articles.set("article-1", { id: "article-1", name: "A" } as Articles);
    articles.set("article-2", { id: "article-2", name: "B" } as Articles);
    return {
      self: {
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
      } as unknown as Clients,
      client,
      supplier: client,
      articles,
    };
  };

  test("an invoice with mixed VAT rates, discounts and a global discount matches its PDF", () => {
    const invoice = {
      type: "invoices",
      reference: "FAC/2026/00001",
      name: "FAC/2026/00001",
      currency: "EUR",
      emit_date: "2026-09-28",
      payment_information: { mode: "" },
      discount: { mode: "percentage", value: 10 },
      content: [
        {
          article: "article-1",
          name: "Service",
          quantity: 3,
          unit_price: 33.33,
          tva: "20",
          discount: { mode: "percentage", value: 5 },
        },
        {
          article: "article-2",
          name: "Book",
          quantity: 2,
          unit_price: 12.5,
          tva: "5.5",
          discount: { mode: "amount", value: 1 },
        },
      ],
    } as unknown as Invoices;
    invoice.total = computePricesFromInvoice(invoice);

    const en16931 = convertInternalToEN16931(invoice, entities());

    expect(() =>
      assertEN16931TotalsMatchPdf(en16931, computePricesFromInvoice(invoice))
    ).not.toThrow();
  });

  test("detects stale stored totals that no longer match the PDF", () => {
    const invoice = {
      type: "invoices",
      reference: "FAC/2026/00002",
      name: "FAC/2026/00002",
      currency: "EUR",
      emit_date: "2026-09-28",
      payment_information: { mode: "" },
      content: [
        {
          article: "article-1",
          name: "Service",
          quantity: 1,
          unit_price: 100,
          tva: "20",
          discount: { mode: "amount", value: 0 },
        },
      ],
    } as unknown as Invoices;
    invoice.total = computePricesFromInvoice(invoice);

    // The content changed but the stored totals were not recomputed
    invoice.content[0].unit_price = 150;

    const en16931 = convertInternalToEN16931(invoice, entities());

    expect(() =>
      assertEN16931TotalsMatchPdf(en16931, computePricesFromInvoice(invoice))
    ).toThrow(EN16931TotalsMismatchError);
  });
});
