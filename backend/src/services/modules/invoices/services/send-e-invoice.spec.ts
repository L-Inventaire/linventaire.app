import { beforeEach, describe, expect, jest, test } from "@jest/globals";

const update = jest.fn();
const getService = jest.fn(async () => ({ update }));
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
  default: { Comments: { createEvent }, EInvoices: { getClient } },
}));

jest.mock("@sentry/node", () => ({ captureException: jest.fn() }));

jest.mock("./generate-pdf", () => ({ generatePdf }));

import { getEInvoiceSkipReason, sendEInvoice } from "./send-e-invoice";

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
