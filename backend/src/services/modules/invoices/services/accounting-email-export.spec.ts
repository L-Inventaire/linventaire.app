import { beforeEach, describe, expect, jest, test } from "@jest/globals";

// In-memory tables, rows matched on equality of the condition fields
let tables: Record<string, any[]> = {};
let candidates: any[] = [];
const matches = (row: any, condition: any) =>
  Object.entries(condition).every(([k, v]) => row[k] === v);
const db = {
  select: jest.fn(async (_ctx: any, table: string, condition: any) =>
    (tables[table] || []).filter((r) => matches(r, condition))
  ),
  selectOne: jest.fn(
    async (_ctx: any, table: string, condition: any) =>
      (tables[table] || []).find((r) => matches(r, condition)) || null
  ),
  insert: jest.fn(async (_ctx: any, table: string, row: any) => {
    tables[table] = [...(tables[table] || []), { ...row }];
  }),
  update: jest.fn(
    async (_ctx: any, table: string, condition: any, changes: any) => {
      (tables[table] || [])
        .filter((r) => matches(r, condition))
        .forEach((r) => Object.assign(r, changes));
    }
  ),
  // Candidates of queueReceivedEInvoicesExports (the SQL filters are tested
  // on a real database), or claim of processPendingAccountingExports: every
  // due pending row
  custom: jest.fn(async (_ctx: any, sql: string) => {
    if (sql.includes("FROM received_e_invoices")) {
      return { rows: candidates };
    }
    const rows = (tables.accounting_email_exports || []).filter(
      (r) => r.status === "pending" && r.next_attempt_at <= Date.now()
    );
    rows.forEach((r) => (r.status = "sending"));
    return { rows: rows.map((r) => ({ ...r })) };
  }),
};

const push = jest.fn<any>(async () => true);
const createEvent = jest.fn();
const downloadInvoice = jest.fn<any>();
const convertToCII = jest.fn<any>(async () => Buffer.from("<cii/>"));
const convertUblToCII = jest.fn<any>(async () => Buffer.from("<cii-ubl/>"));
const getClient = jest.fn(async () => ({
  downloadInvoice,
  convertToCII,
  convertUblToCII,
}));
const embedFacturXXml = jest.fn<any>(async () => Buffer.from("%PDF-facturx"));
const generatePdf = jest.fn<any>(async () => ({
  pdf: Buffer.from("%PDF-ours"),
}));

jest.mock("#src/platform/index", () => ({
  __esModule: true,
  default: {
    Db: { getService: async () => db },
    LoggerDb: { get: () => ({ error: jest.fn() }) },
    PushEMail: { push },
  },
}));

jest.mock("#src/services/index", () => ({
  __esModule: true,
  default: { Comments: { createEvent }, EInvoices: { getClient } },
}));

jest.mock("@sentry/node", () => ({ captureException: jest.fn() }));

jest.mock("./generate-pdf", () => ({ generatePdf }));

jest.mock("../../e-invoices/services/facturx-generator", () => ({
  embedFacturXXml,
}));

const convertEN16931ToInternal = jest.fn<any>((en: any, entities: any) => ({
  type: "supplier_invoices",
  reference: en.number,
  supplier: entities.supplier.id,
  content: [],
}));
jest.mock("../../e-invoices/services/invoice-converter", () => ({
  convertEN16931ToInternal,
}));
jest.mock("@shared/invoices", () => ({
  computePricesFromInvoice: () => ({ total_with_taxes: 120 }),
}));

import {
  getAccountingExportAddress,
  processPendingAccountingExports,
  queueAccountingEmailExport,
  queueReceivedEInvoicesExports,
} from "./accounting-email-export";

const ENABLED_AT = new Date("2026-10-01").getTime();
const BEFORE = new Date("2026-09-01").getTime();
const AFTER = new Date("2026-10-15").getTime();

const ctx = { client_id: "cl-1", id: "us-1", role: "USER" } as any;

const company = (email_export: any = {}) => ({
  id: "cl-1",
  company: { name: "ACME" },
  smtp: {},
  accounting: {
    email_export: {
      sales_email: "ventes@compta.fr",
      sales_enabled_at: ENABLED_AT,
      purchases_email: "achats@compta.fr",
      purchases_enabled_at: ENABLED_AT,
      ...email_export,
    },
  },
});

const invoice = (extra: any = {}) => ({
  id: "inv-1",
  client_id: "cl-1",
  type: "invoices",
  state: "sent",
  reference: "FA/2026/12",
  created_at: AFTER,
  ...extra,
});

const exportRows = () => tables.accounting_email_exports || [];

// Queue then process right away (as if the delay had passed)
const queueAndProcess = async (doc: any) => {
  await queueAccountingEmailExport(ctx, doc);
  exportRows().forEach((r) => (r.next_attempt_at = 0));
  await processPendingAccountingExports();
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] });
  tables = { clients: [company()], invoices: [] };
  candidates = [];
});

describe("getAccountingExportAddress", () => {
  test("disabled without address or activation date", () => {
    expect(getAccountingExportAddress(null, "sales")).toBeNull();
    expect(
      getAccountingExportAddress(company({ sales_email: "" }) as any, "sales")
    ).toBeNull();
    expect(
      getAccountingExportAddress(
        company({ purchases_enabled_at: 0 }) as any,
        "purchases"
      )
    ).toBeNull();
  });

  test("one address per side", () => {
    expect(getAccountingExportAddress(company() as any, "purchases")).toEqual({
      email: "achats@compta.fr",
      enabled_at: ENABLED_AT,
    });
  });
});

describe("queueAccountingEmailExport", () => {
  test("queues a sent invoice", async () => {
    await queueAccountingEmailExport(ctx, invoice() as any);
    expect(exportRows()).toMatchObject([
      { invoice_id: "inv-1", side: "sales", status: "pending" },
    ]);
  });

  test("nothing when the address is not set", async () => {
    tables.clients = [company({ sales_email: "" })];
    await queueAccountingEmailExport(ctx, invoice() as any);
    expect(exportRows()).toEqual([]);
  });

  test("not for quotes", async () => {
    await queueAccountingEmailExport(ctx, invoice({ type: "quotes" }) as any);
    expect(exportRows()).toEqual([]);
  });

  test("purchases entered before the activation are not sent", async () => {
    await queueAccountingEmailExport(
      ctx,
      invoice({ type: "supplier_invoices", created_at: BEFORE }) as any
    );
    expect(exportRows()).toEqual([]);
  });

  test("a document is queued only once", async () => {
    await queueAccountingEmailExport(ctx, invoice() as any);
    await queueAccountingEmailExport(ctx, invoice() as any);
    expect(exportRows()).toHaveLength(1);
  });
});

describe("processPendingAccountingExports", () => {
  test("sends the PDF of a sale, named and titled with the reference", async () => {
    tables.invoices = [invoice()];
    await queueAndProcess(invoice());

    expect(generatePdf).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith(
      expect.anything(),
      "ventes@compta.fr",
      "",
      expect.objectContaining({
        subject: "FA/2026/12",
        attachments: [
          { filename: "FA-2026-12.pdf", content: Buffer.from("%PDF-ours") },
        ],
      }),
      {}
    );
    expect(exportRows()[0]).toMatchObject({
      status: "sent",
      source: "document",
    });
    expect(createEvent).toHaveBeenCalledTimes(1);
  });

  test("a manual purchase goes to the purchases address", async () => {
    const doc = invoice({ type: "supplier_invoices" });
    tables.invoices = [doc];
    await queueAndProcess(doc);
    expect(push.mock.calls[0][1]).toBe("achats@compta.fr");
    expect(exportRows()[0]).toMatchObject({
      status: "sent",
      source: "document",
    });
  });

  test("the attached e-invoice has priority (PDF received as is)", async () => {
    const doc = invoice({ type: "supplier_invoices" });
    tables.invoices = [doc];
    tables.received_e_invoices = [
      {
        id: "rei-1",
        client_id: "cl-1",
        state: "attached",
        supplier_invoice_id: "inv-1",
        superpdp_invoice_id: 42,
        received_at: AFTER,
      },
    ];
    downloadInvoice.mockResolvedValueOnce({
      contentType: "application/pdf",
      data: Buffer.from("%PDF-supplier"),
    });
    await queueAndProcess(doc);

    expect(downloadInvoice).toHaveBeenCalledWith(42);
    expect(generatePdf).not.toHaveBeenCalled();
    expect((push.mock.calls[0][3] as any).attachments[0].content).toEqual(
      Buffer.from("%PDF-supplier")
    );
    expect(exportRows()[0]).toMatchObject({
      status: "sent",
      source: "e_invoice",
      received_e_invoice_id: "rei-1",
    });
  });

  test("an XML e-invoice is embedded in our PDF (Factur-X)", async () => {
    const doc = invoice({ type: "supplier_invoices" });
    tables.invoices = [doc];
    tables.received_e_invoices = [
      {
        id: "rei-1",
        client_id: "cl-1",
        state: "new",
        supplier_invoice_id: "inv-1",
        superpdp_invoice_id: 42,
        received_at: AFTER,
      },
    ];
    const cii = Buffer.from(
      "<rsm:CrossIndustryInvoice>...</rsm:CrossIndustryInvoice>"
    );
    downloadInvoice.mockResolvedValueOnce({
      contentType: "application/xml",
      data: cii,
    });
    await queueAndProcess(doc);

    expect(generatePdf).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ skipFacturX: true })
    );
    // Embedded locally, SuperPDP is not called
    expect(embedFacturXXml).toHaveBeenCalledWith(Buffer.from("%PDF-ours"), cii);
    expect(convertToCII).not.toHaveBeenCalled();
    expect(exportRows()[0]).toMatchObject({
      status: "sent",
      source: "e_invoice",
    });
  });

  test("a UBL e-invoice is converted to CII then embedded", async () => {
    const doc = invoice({ type: "supplier_invoices" });
    tables.invoices = [doc];
    tables.received_e_invoices = [
      {
        id: "rei-1",
        client_id: "cl-1",
        state: "attached",
        supplier_invoice_id: "inv-1",
        superpdp_invoice_id: 42,
        received_at: AFTER,
        en_invoice: { number: "F-42" },
      },
    ];
    downloadInvoice.mockResolvedValueOnce({
      contentType: "application/xml",
      data: Buffer.from("<Invoice xmlns='urn:oasis:names:specification:ubl'/>"),
    });
    await queueAndProcess(doc);

    // Converted from the file received, not from our en_invoice copy
    expect(convertUblToCII).toHaveBeenCalledTimes(1);
    expect(convertToCII).not.toHaveBeenCalled();
    expect(embedFacturXXml).toHaveBeenCalledWith(
      Buffer.from("%PDF-ours"),
      Buffer.from("<cii-ubl/>")
    );
    expect(exportRows()[0]).toMatchObject({ source: "e_invoice" });
  });

  test("e-invoice unavailable: our Factur-X is sent instead", async () => {
    const doc = invoice({ type: "supplier_invoices" });
    tables.invoices = [doc];
    tables.received_e_invoices = [
      {
        id: "rei-1",
        client_id: "cl-1",
        state: "attached",
        supplier_invoice_id: "inv-1",
        superpdp_invoice_id: 42,
        received_at: AFTER,
      },
    ];
    downloadInvoice.mockRejectedValueOnce(new Error("SuperPDP down"));
    await queueAndProcess(doc);

    expect(generatePdf).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      { checkedIndexes: {} }
    );
    expect(exportRows()[0]).toMatchObject({
      status: "sent",
      source: "document",
    });
  });

  test("an e-invoice already sent with another document is not sent twice", async () => {
    const doc = invoice({ type: "supplier_invoices", id: "inv-2" });
    tables.invoices = [doc];
    tables.received_e_invoices = [
      {
        id: "rei-1",
        client_id: "cl-1",
        state: "attached",
        supplier_invoice_id: "inv-2",
        superpdp_invoice_id: 42,
        received_at: AFTER,
      },
    ];
    tables.accounting_email_exports = [
      {
        client_id: "cl-1",
        invoice_id: "inv-1",
        status: "sent",
        received_e_invoice_id: "rei-1",
      },
    ];
    await queueAndProcess(doc);

    expect(push).not.toHaveBeenCalled();
    expect(exportRows().find((r) => r.invoice_id === "inv-2")).toMatchObject({
      status: "skipped",
    });
  });

  test("an e-invoice received before the activation is not sent", async () => {
    const doc = invoice({ type: "supplier_invoices" });
    tables.invoices = [doc];
    tables.received_e_invoices = [
      {
        id: "rei-1",
        client_id: "cl-1",
        state: "attached",
        supplier_invoice_id: "inv-1",
        superpdp_invoice_id: 42,
        received_at: BEFORE,
      },
    ];
    await queueAndProcess(doc);

    expect(push).not.toHaveBeenCalled();
    expect(exportRows()[0]).toMatchObject({ status: "skipped" });
  });

  test("a document back to draft is not sent", async () => {
    await queueAccountingEmailExport(ctx, invoice() as any);
    tables.invoices = [invoice({ state: "draft" })];
    exportRows()[0].next_attempt_at = 0;
    await processPendingAccountingExports();

    expect(push).not.toHaveBeenCalled();
    expect(exportRows()[0]).toMatchObject({ status: "skipped" });
  });

  test("a failed email is retried, then reported", async () => {
    tables.invoices = [invoice()];
    push.mockResolvedValue(false);
    await queueAndProcess(invoice());
    expect(exportRows()[0]).toMatchObject({ status: "pending", attempts: 1 });
    expect(createEvent).not.toHaveBeenCalled();

    for (let i = 0; i < 4; i++) {
      exportRows()[0].next_attempt_at = 0;
      await processPendingAccountingExports();
    }
    expect(exportRows()[0]).toMatchObject({ status: "failed", attempts: 5 });
    expect(createEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        metadata: expect.objectContaining({
          event_type: "accounting_export_failed",
        }),
      })
    );
    push.mockResolvedValue(true);
  });
});

describe("received e-invoices", () => {
  const eInvoice = (extra: any = {}) => ({
    id: "rei-1",
    client_id: "cl-1",
    state: "new",
    supplier_invoice_id: "",
    superpdp_invoice_id: 42,
    invoice_number: "F/42",
    seller_name: "Fournisseur",
    received_at: AFTER,
    en_invoice: {
      number: "F/42",
      seller: {
        name: "Fournisseur SAS",
        vat_identifier: "FR123",
        legal_registration_identifier: { value: "123456789" },
        postal_address: { city: "Lyon", post_code: "69001" },
      },
    },
    ...extra,
  });

  // Queued by the cron, then processed
  const receiveAndProcess = async () => {
    candidates = (tables.received_e_invoices || []).map((r) => ({
      client_id: r.client_id,
      id: r.id,
      email: "achats@compta.fr",
    }));
    await queueReceivedEInvoicesExports();
    await processPendingAccountingExports();
  };

  test("the cron queues the e-invoices not sent yet", async () => {
    candidates = [
      { client_id: "cl-1", id: "rei-1", email: "achats@compta.fr" },
      { client_id: "cl-1", id: "rei-2", email: "achats@compta.fr" },
    ];
    await queueReceivedEInvoicesExports();
    expect(exportRows()).toMatchObject([
      {
        invoice_id: "rei-1",
        item_entity: "received_e_invoices",
        received_e_invoice_id: "rei-1",
        side: "purchases",
        status: "pending",
      },
      { invoice_id: "rei-2", item_entity: "received_e_invoices" },
    ]);
  });

  test("a PDF e-invoice attached to nothing is sent as is", async () => {
    tables.received_e_invoices = [eInvoice()];
    downloadInvoice.mockResolvedValueOnce({
      contentType: "application/pdf",
      data: Buffer.from("%PDF-supplier"),
    });
    await receiveAndProcess();

    expect(push).toHaveBeenCalledWith(
      expect.anything(),
      "achats@compta.fr",
      "",
      expect.objectContaining({
        subject: "F/42",
        attachments: [
          { filename: "F-42.pdf", content: Buffer.from("%PDF-supplier") },
        ],
      }),
      {}
    );
    expect(generatePdf).not.toHaveBeenCalled();
    expect(exportRows()[0]).toMatchObject({
      status: "sent",
      source: "e_invoice",
    });
    expect(createEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        item_entity: "received_e_invoices",
        item_id: "rei-1",
      })
    );
  });

  test("a UBL conversion refused: a PDF made from its data is sent", async () => {
    tables.received_e_invoices = [eInvoice()];
    downloadInvoice.mockResolvedValueOnce({
      contentType: "application/xml",
      data: Buffer.from("<Invoice xmlns='urn:oasis:names:specification:ubl'/>"),
    });
    convertUblToCII.mockRejectedValueOnce(new Error("refused"));
    await receiveAndProcess();

    expect(push).toHaveBeenCalledTimes(1);
    expect(embedFacturXXml).not.toHaveBeenCalled();
    expect(exportRows()[0]).toMatchObject({ status: "sent" });
  });

  test("a rejected e-invoice is sent too", async () => {
    tables.received_e_invoices = [eInvoice({ state: "rejected" })];
    downloadInvoice.mockResolvedValueOnce({
      contentType: "application/pdf",
      data: Buffer.from("%PDF-supplier"),
    });
    await receiveAndProcess();
    expect(push).toHaveBeenCalledTimes(1);
  });

  test("an XML e-invoice attached to nothing: PDF made from its data", async () => {
    tables.received_e_invoices = [eInvoice()];
    const cii = Buffer.from(
      "<rsm:CrossIndustryInvoice>...</rsm:CrossIndustryInvoice>"
    );
    downloadInvoice.mockResolvedValueOnce({
      contentType: "application/xml",
      data: cii,
    });
    await receiveAndProcess();

    const [, document, options] = generatePdf.mock.calls[0] as any[];
    expect(document).toMatchObject({ id: "rei-1", reference: "F/42" });
    expect(options).toMatchObject({
      skipFacturX: true,
      counterParty: {
        business_name: "Fournisseur SAS",
        business_tax_id: "FR123",
        business_registered_id: "123456789",
        address: { city: "Lyon", zip: "69001" },
      },
    });
    expect(embedFacturXXml).toHaveBeenCalledWith(Buffer.from("%PDF-ours"), cii);
    expect(exportRows()[0]).toMatchObject({
      status: "sent",
      source: "e_invoice",
    });
  });

  test("an XML e-invoice attached to a supplier invoice uses its PDF", async () => {
    const doc = invoice({ type: "supplier_invoices", state: "draft" });
    tables.invoices = [doc];
    tables.received_e_invoices = [
      eInvoice({ state: "attached", supplier_invoice_id: "inv-1" }),
    ];
    downloadInvoice.mockResolvedValueOnce({
      contentType: "application/xml",
      data: Buffer.from("<rsm:CrossIndustryInvoice/>"),
    });
    await receiveAndProcess();

    expect(generatePdf.mock.calls[0][1]).toMatchObject({ id: "inv-1" });
    expect(convertEN16931ToInternal).not.toHaveBeenCalled();
    // Timeline of the e-invoice and of its supplier invoice
    expect(createEvent.mock.calls.map((c: any) => c[1].item_id)).toEqual([
      "rei-1",
      "inv-1",
    ]);
  });

  test("not sent again when its supplier invoice is booked", async () => {
    tables.received_e_invoices = [eInvoice()];
    downloadInvoice.mockResolvedValue({
      contentType: "application/pdf",
      data: Buffer.from("%PDF-supplier"),
    });
    await receiveAndProcess();
    expect(push).toHaveBeenCalledTimes(1);

    // Supplier invoice created from it, then booked
    const doc = invoice({ type: "supplier_invoices" });
    tables.invoices = [doc];
    tables.received_e_invoices[0].state = "attached";
    tables.received_e_invoices[0].supplier_invoice_id = "inv-1";
    await queueAndProcess(doc);

    expect(push).toHaveBeenCalledTimes(1);
    expect(exportRows().find((r) => r.invoice_id === "inv-1")).toMatchObject({
      status: "skipped",
    });
    downloadInvoice.mockReset();
  });

  test("not sent again when it was sent with its supplier invoice", async () => {
    tables.received_e_invoices = [
      eInvoice({ state: "attached", supplier_invoice_id: "inv-1" }),
    ];
    tables.accounting_email_exports = [
      {
        client_id: "cl-1",
        invoice_id: "inv-1",
        status: "sent",
        received_e_invoice_id: "rei-1",
      },
    ];
    // The cron query excludes it: queued anyway, the processing checks it too
    await receiveAndProcess();

    expect(push).not.toHaveBeenCalled();
    expect(exportRows().find((r) => r.invoice_id === "rei-1")).toMatchObject({
      status: "skipped",
    });
  });

  test("an e-invoice received before the activation is not sent", async () => {
    tables.received_e_invoices = [eInvoice({ received_at: BEFORE })];
    await receiveAndProcess();
    expect(push).not.toHaveBeenCalled();
    expect(exportRows()[0]).toMatchObject({ status: "skipped" });
  });

  test("a manual purchase is still sent when booked", async () => {
    const doc = invoice({ type: "supplier_invoices" });
    tables.invoices = [doc];
    await queueAndProcess(doc);
    expect(push.mock.calls[0][1]).toBe("achats@compta.fr");
  });
});
