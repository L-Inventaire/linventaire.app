import { beforeEach, describe, expect, jest, test } from "@jest/globals";

const update = jest.fn();
const selectOne = jest.fn<any>();
const custom = jest.fn<any>();
const getService = jest.fn(async () => ({ update, selectOne, custom }));
const getConfig = jest.fn<any>();
const refreshContactEInvoicesStatus = jest.fn<any>();
const createEvent = jest.fn();
const sendInvoice = jest.fn<any>();
const getClient = jest.fn(async () => ({ sendInvoice }));
const generatePdf = jest.fn(async () => ({ pdf: Buffer.from("pdf") }));

jest.mock("#src/platform/index", () => ({
  __esModule: true,
  default: {
    Db: { getService },
    LoggerDb: { get: () => ({ error: jest.fn() }) },
  },
}));

jest.mock("#src/services/index", () => ({
  __esModule: true,
  default: {
    Comments: { createEvent },
    EInvoices: { getClient, getConfig },
  },
}));

jest.mock("../../contacts/services/refresh-e-invoices-status", () => ({
  refreshContactEInvoicesStatus,
}));

jest.mock("@sentry/node", () => ({ captureException: jest.fn() }));

jest.mock("./generate-pdf", () => ({ generatePdf }));

import {
  getEInvoiceSkipReason,
  retryEInvoice,
  sendEInvoice,
} from "./send-e-invoice";

const ctx = { client_id: "cl-1", id: "us-1", role: "USER" } as any;
const invoice = (extra: any = {}) =>
  ({
    id: "inv-1",
    client_id: "cl-1",
    type: "invoices",
    en16931: { number: "F-1" },
    ...extra,
  } as any);

describe("getEInvoiceSkipReason", () => {
  test("a French company is concerned", () => {
    expect(
      getEInvoiceSkipReason({
        type: "company",
        address: { country: "FR" },
      } as any)
    ).toBeNull();
  });

  test("no country means France", () => {
    expect(
      getEInvoiceSkipReason({ type: "company", address: {} } as any)
    ).toBeNull();
  });

  test("a customer abroad is skipped", () => {
    expect(
      getEInvoiceSkipReason({
        type: "company",
        address: { country: "BE" },
      } as any)
    ).toMatch(/hors de France/);
  });

  test("a private individual is skipped", () => {
    expect(
      getEInvoiceSkipReason({
        type: "person",
        address: { country: "FR" },
      } as any)
    ).toMatch(/particulier/);
  });

  test("an unknown customer is not skipped", () => {
    expect(getEInvoiceSkipReason(null)).toBeNull();
  });
});

describe("sendEInvoice", () => {
  beforeEach(() => {
    update.mockReset();
    createEvent.mockReset();
    sendInvoice.mockReset();
    selectOne.mockReset();
    refreshContactEInvoicesStatus.mockReset();
  });

  test("records the success and adds a timeline line", async () => {
    sendInvoice.mockResolvedValue({ id: 42 });
    await sendEInvoice(ctx, invoice());

    const payload = update.mock.calls[0][3] as any;
    expect(payload.e_invoice.status).toBe("uploaded");
    expect(payload.e_invoice.superpdp_id).toBe(42);
    const event = createEvent.mock.calls[0][1] as any;
    expect(event.content).toMatch(/envoyée avec succès/);
    expect(event.metadata.event_type).toBeUndefined();
  });

  test("non blocking: records the failure, notifies, never throws", async () => {
    sendInvoice.mockRejectedValue(new Error("boom"));
    await expect(sendEInvoice(ctx, invoice())).resolves.toBeUndefined();

    const payload = update.mock.calls[0][3] as any;
    expect(payload.e_invoice.status).toBe("failed");
    expect(payload.e_invoice.error).toBe("boom");
    const event = createEvent.mock.calls[0][1] as any;
    expect(event.content).toMatch(/Échec/);
    expect(event.metadata.event_type).toBe("e_invoice_failed");
  });

  test("non blocking: an invalid EN16931 is a failure", async () => {
    await sendEInvoice(ctx, invoice({ en16931: null }));
    expect(sendInvoice).not.toHaveBeenCalled();
    expect((update.mock.calls[0][3] as any).e_invoice.status).toBe("failed");
  });

  test("blocking: throws and records nothing", async () => {
    sendInvoice.mockRejectedValue(new Error("boom"));
    await expect(
      sendEInvoice(ctx, invoice(), { throwOnError: true })
    ).rejects.toThrow(/reste en brouillon : boom/);
    expect(update).not.toHaveBeenCalled();
    expect(createEvent).not.toHaveBeenCalled();
  });
});

describe("sendEInvoice - customer e-invoicing status", () => {
  const customer = (extra: any = {}) => ({
    id: "co-1",
    client_id: "cl-1",
    type: "company",
    address: { country: "FR" },
    business_registered_id: "39150621900012",
    e_invoices_identifier: "0225:391506219",
    e_invoices_active: false,
    ...extra,
  });

  beforeEach(() => {
    update.mockReset();
    createEvent.mockReset();
    sendInvoice.mockReset();
    selectOne.mockReset();
    refreshContactEInvoicesStatus.mockReset();
  });

  test("an inactive customer found active again is sent", async () => {
    selectOne.mockResolvedValue(customer());
    refreshContactEInvoicesStatus.mockResolvedValue(
      customer({ e_invoices_active: true })
    );
    sendInvoice.mockResolvedValue({ id: 42 });

    await sendEInvoice(ctx, invoice({ client: "co-1" }));

    expect(refreshContactEInvoicesStatus).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({ id: "co-1" }),
      { force: true }
    );
    expect(sendInvoice).toHaveBeenCalled();
    expect((update.mock.calls[0][3] as any).e_invoice.status).toBe("uploaded");
  });

  test("a customer still not active is not sent, it is a failure", async () => {
    selectOne.mockResolvedValue(customer());
    refreshContactEInvoicesStatus.mockResolvedValue(customer());

    await sendEInvoice(ctx, invoice({ client: "co-1" }));

    expect(sendInvoice).not.toHaveBeenCalled();
    const payload = update.mock.calls[0][3] as any;
    expect(payload.e_invoice.status).toBe("failed");
    expect(payload.e_invoice.error).toMatch(/annuaire/);
  });

  test("an active customer is not checked again", async () => {
    selectOne.mockResolvedValue(customer({ e_invoices_active: true }));
    sendInvoice.mockResolvedValue({ id: 42 });

    await sendEInvoice(ctx, invoice({ client: "co-1" }));

    expect(refreshContactEInvoicesStatus).not.toHaveBeenCalled();
    expect(sendInvoice).toHaveBeenCalled();
  });

  test("a customer without SIREN is not checked (nothing to search)", async () => {
    selectOne.mockResolvedValue(customer({ business_registered_id: "" }));
    sendInvoice.mockResolvedValue({ id: 42 });

    await sendEInvoice(ctx, invoice({ client: "co-1" }));

    expect(refreshContactEInvoicesStatus).not.toHaveBeenCalled();
    expect(sendInvoice).toHaveBeenCalled();
  });
});

describe("retryEInvoice", () => {
  beforeEach(() => {
    update.mockReset();
    createEvent.mockReset();
    sendInvoice.mockReset();
    selectOne.mockReset();
    custom.mockReset();
    getConfig.mockReset();
    getConfig.mockResolvedValue({ connection_status: "connected" });
  });

  test("a failed transmission is claimed then sent again", async () => {
    selectOne.mockImplementation(async (_ctx: any, table: string) =>
      table === "contacts"
        ? null
        : invoice({ state: "sent", e_invoice: { status: "failed" } })
    );
    custom.mockResolvedValue({ rows: [{ id: "inv-1" }] });
    sendInvoice.mockResolvedValue({ id: 42 });

    await retryEInvoice(ctx, "inv-1");

    expect(custom.mock.calls[0][1]).toMatch(/e_invoice->>'status' = 'failed'/);
    expect(sendInvoice).toHaveBeenCalledTimes(1);
  });

  test("a transmission that is not failed is never sent twice", async () => {
    selectOne.mockResolvedValue(
      invoice({ state: "sent", e_invoice: { status: "uploaded" } })
    );
    // The atomic claim only matches failed transmissions
    custom.mockResolvedValue({ rows: [] });

    await expect(retryEInvoice(ctx, "inv-1")).rejects.toMatchObject({
      status: 409,
    });
    expect(sendInvoice).not.toHaveBeenCalled();
  });

  test("a draft can't be sent", async () => {
    selectOne.mockResolvedValue(invoice({ state: "draft" }));
    await expect(retryEInvoice(ctx, "inv-1")).rejects.toMatchObject({
      status: 400,
    });
    expect(custom).not.toHaveBeenCalled();
  });
});
