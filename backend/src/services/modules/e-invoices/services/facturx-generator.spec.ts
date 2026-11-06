import { beforeEach, describe, expect, jest, test } from "@jest/globals";

// In-memory facturx_xml_cache
let cache: any[] = [];
const matches = (row: any, condition: any) =>
  Object.entries(condition).every(([k, v]) => row[k] === v);
const db = {
  selectOne: jest.fn(
    async (_ctx: any, _table: string, condition: any) =>
      cache.find((r) => matches(r, condition)) || null
  ),
  insert: jest.fn(async (_ctx: any, _table: string, row: any) => {
    cache.push({ ...row });
  }),
};
jest.mock("#src/platform/index", () => ({
  __esModule: true,
  default: { Db: { getService: async () => db } },
}));
import { computePricesFromInvoice } from "@shared/invoices";
import { EN16931Invoice } from "@shared/en16931-types";
import Clients from "#src/services/clients/entities/clients";
import Articles from "../../articles/entities/articles";
import Contacts from "../../contacts/entities/contacts";
import Invoices from "../../invoices/entities/invoices";
import { SuperPDPClient } from "../../../../platform/e-invoices/adapters/superpdp/client";
import {
  assertEN16931TotalsMatchPdf,
  embedFacturXXml,
  EN16931TotalsMismatchError,
  generateFacturXPdf,
  getEN16931InvoiceFromError,
  getFacturXXml,
} from "./facturx-generator";
import { PDFDocument, PDFName, PDFRawStream } from "pdf-lib";
import * as converter from "./invoice-converter";
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

describe("generateFacturXPdf errors", () => {
  test("the EN16931 data is attached to the error for Sentry", async () => {
    const client = {
      business_name: "ACME",
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
    jest.spyOn(converter, "getResolvedEntities").mockResolvedValue({
      self: {
        company: {
          name: "Proxima",
          legal_name: "Proxima",
          registration_number: "527830681",
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
    });

    const invoice = {
      type: "invoices",
      reference: "FAC/2026/00003",
      name: "FAC/2026/00003",
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

    const superpdpClient = {
      convertToCII: jest.fn(async () => {
        throw new Error("Failed to convert the invoice: [BR-CO-15]");
      }),
    } as unknown as SuperPDPClient;

    const error = await generateFacturXPdf(
      { client_id: "c1" } as any,
      Buffer.from(""),
      invoice,
      superpdpClient
    ).catch((e) => e);

    expect(error).toBeInstanceOf(Error);
    expect(getEN16931InvoiceFromError(error)?.number).toBe("FAC/2026/00003");
    expect(getEN16931InvoiceFromError(new Error("other"))).toBeUndefined();
  });

  test("a credit note sent to SuperPDP references the invoice it corrects (BR-FR-CO-05)", async () => {
    const client = {
      business_name: "ACME",
      address: { address_line_1: "1 rue", city: "Paris", zip: "75001" },
      invoices: {},
    } as unknown as Contacts;
    const articles = new Map<string, Articles>();
    articles.set("article-1", { id: "article-1", name: "A" } as Articles);
    jest.spyOn(converter, "getResolvedEntities").mockResolvedValue({
      self: {
        company: { name: "Proxima", registration_number: "527830681" },
        address: { address_line_1: "44", city: "FLOURENS", zip: "31130" },
        invoices: {},
      } as unknown as Clients,
      client,
      supplier: client,
      articles,
      precedingInvoices: [
        {
          reference: "FAC/2026/02182",
          emit_date: Date.UTC(2026, 7, 31, 12),
          state: "sent",
        } as any,
      ],
    });

    const invoice = {
      type: "credit_notes",
      reference: "FAC/2026/02775",
      currency: "EUR",
      emit_date: "2026-10-31",
      from_rel_invoice: ["inv-0"],
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

    const convertToFacturX = jest.fn(async () => Buffer.from("pdf"));
    await generateFacturXPdf(
      { client_id: "c1" } as any,
      Buffer.from(""),
      invoice,
      { convertToFacturX } as unknown as SuperPDPClient,
      undefined,
      invoice.total,
      { remote: true }
    );

    const sent = (convertToFacturX.mock.calls[0] as any[])[1];
    expect(sent.type_code).toBe(381);
    expect(sent.preceding_invoice_references).toEqual([
      { reference: "FAC/2026/02182", issue_date: "2026-08-31" },
    ]);
  });
});

describe("getFacturXXml", () => {
  const invoice = { id: "inv-1", client_id: "c1" };
  const en16931 = { number: "F-1" } as EN16931Invoice;
  const ctx = { client_id: "c1", db_tnx: { id: "tnx" } } as any;

  beforeEach(() => {
    cache = [];
    jest.clearAllMocks();
  });

  test("SuperPDP converts once, then the XML is reused", async () => {
    const convertToCII = jest.fn(async () => Buffer.from("<cii/>"));
    const client = { convertToCII } as unknown as SuperPDPClient;

    expect(await getFacturXXml(ctx, invoice, en16931, client)).toBe("<cii/>");
    expect(await getFacturXXml(ctx, invoice, en16931, client)).toBe("<cii/>");
    expect(convertToCII).toHaveBeenCalledTimes(1);
    // Never in the transaction of the caller
    expect((db.insert.mock.calls[0][0] as any).db_tnx).toBeUndefined();
  });

  test("converted again when the data changes", async () => {
    const convertToCII = jest.fn(async () => Buffer.from("<cii/>"));
    const client = { convertToCII } as unknown as SuperPDPClient;

    await getFacturXXml(ctx, invoice, en16931, client);
    await getFacturXXml(
      ctx,
      invoice,
      { number: "F-1", note: "x" } as unknown as EN16931Invoice,
      client
    );
    expect(convertToCII).toHaveBeenCalledTimes(2);
  });

  test("a refusal is kept, a temporary failure is retried", async () => {
    const refused = Object.assign(new Error("[BR-S-02]"), { status: 400 });
    const down = Object.assign(new Error("timeout"), { status: 503 });
    const convertToCII = jest
      .fn<any>()
      .mockRejectedValueOnce(down)
      .mockRejectedValueOnce(refused);
    const client = { convertToCII } as unknown as SuperPDPClient;

    await expect(getFacturXXml(ctx, invoice, en16931, client)).rejects.toBe(
      down
    );
    await expect(getFacturXXml(ctx, invoice, en16931, client)).rejects.toBe(
      refused
    );
    const cached = await getFacturXXml(ctx, invoice, en16931, client).catch(
      (e) => e
    );
    expect(cached).toMatchObject({ message: "[BR-S-02]", cached: true });
    expect(convertToCII).toHaveBeenCalledTimes(2);
  });
});

describe("embedFacturXXml", () => {
  test("adds factur-x.xml as associated file and the Factur-X metadata", async () => {
    const base = await PDFDocument.create();
    base.addPage();
    const pdf = await embedFacturXXml(
      Buffer.from(await base.save()),
      "<rsm:CrossIndustryInvoice/>"
    );

    const doc = await PDFDocument.load(new Uint8Array(pdf));
    const af = doc.catalog.lookup(PDFName.of("AF")) as any;
    expect(af.size()).toBe(1);
    const fileSpec = doc.context.lookup(af.get(0)) as any;
    expect(fileSpec.get(PDFName.of("AFRelationship"))).toBe(PDFName.of("Data"));
    expect(fileSpec.lookup(PDFName.of("F")).decodeText()).toBe("factur-x.xml");

    const metadata = doc.catalog.lookup(PDFName.of("Metadata")) as PDFRawStream;
    const xmp = Buffer.from(metadata.getContents()).toString("utf-8");
    expect(xmp).toContain("<pdfaid:part>3</pdfaid:part>");
    expect(xmp).toContain(
      "<fx:DocumentFileName>factur-x.xml</fx:DocumentFileName>"
    );
    expect(xmp).toContain(
      "<fx:ConformanceLevel>EN 16931</fx:ConformanceLevel>"
    );
    expect(pdf.subarray(0, 8).toString()).toBe("%PDF-1.7");
  });
});
