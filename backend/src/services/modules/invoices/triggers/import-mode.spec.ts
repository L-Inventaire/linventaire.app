import { describe, expect, jest, test } from "@jest/globals";

// Collect the triggers instead of registering them
const mockRegistered: { name?: string; test?: (...args: any[]) => boolean }[] =
  [];
jest.mock("#src/platform/index", () => ({
  __esModule: true,
  default: {
    TriggersManager: {
      registerTrigger: (_entity: any, options: any) =>
        mockRegistered.push(options),
    },
  },
}));
jest.mock("#src/services/index", () => ({ __esModule: true, default: {} }));
jest.mock("../../signing-sessions/routes", () => ({
  getPdfForInvoice: jest.fn(),
}));
jest.mock("../../signing-sessions/services/utils", () => ({
  generateEmailMessageToRecipient: jest.fn(),
}));
jest.mock("../services/generate-pdf", () => ({ generatePdf: jest.fn() }));
jest.mock("../services/send-e-invoice", () => ({ sendEInvoice: jest.fn() }));
jest.mock("../../contacts/services/french-directory", () => ({
  getFrenchDirectoryEntries: jest.fn(),
}));

import { setOnPurchaseOrderTrigger } from "./on-purchase-order";
import { setOnSentEInvoiceTrigger } from "./on-sent-e-invoice";
import { setTriggerFirstReminderDate } from "./reminders";
import { setupOnSirenChanged } from "../../contacts/triggers/on-siren-changed";

setOnSentEInvoiceTrigger();
setTriggerFirstReminderDate();
setOnPurchaseOrderTrigger();
setupOnSirenChanged();
const [eInvoiceTrigger, reminderTrigger, purchaseOrderTrigger, sirenTrigger] =
  mockRegistered;

const ctx = { client_id: "cl-1", role: "API" } as any;
const importCtx = { ...ctx, import: true };

describe("import mode: no external effect for imported documents", () => {
  test("the French directory is not called for an imported contact", () => {
    const contact = { business_registered_id: "552100554" };
    expect(sirenTrigger.test!(ctx, contact, null)).toBe(true);
    expect(sirenTrigger.test!(importCtx, contact, null)).toBe(false);
  });

  test("a non draft invoice is not transmitted as an e-invoice", () => {
    const invoice = { type: "invoices", state: "closed", e_invoice: {} };
    expect(eInvoiceTrigger.test!(ctx, invoice, null)).toBe(true);
    expect(eInvoiceTrigger.test!(importCtx, invoice, null)).toBe(false);
  });

  test("an invoice already uploaded is never transmitted again", () => {
    const invoice = {
      type: "invoices",
      state: "closed",
      e_invoice: { status: "uploaded" },
    };
    expect(eInvoiceTrigger.test!(ctx, invoice, null)).toBe(false);
  });

  test("a sent quote gets no reminder date", () => {
    const quote = { type: "quotes", state: "sent" };
    expect(reminderTrigger.test!(ctx, quote, null)).toBe(true);
    expect(reminderTrigger.test!(importCtx, quote, null)).toBe(false);
  });

  test("a quote created as purchase order is imported without error nor email", () => {
    const quote = { type: "quotes", state: "purchase_order" };
    // Used to throw a TypeError on creation (no previous version)
    expect(purchaseOrderTrigger.test!(ctx, quote, null)).toBe(false);
    expect(
      purchaseOrderTrigger.test!(ctx, quote, { ...quote, state: "sent" })
    ).toBe(true);
    expect(
      purchaseOrderTrigger.test!(importCtx, quote, { ...quote, state: "sent" })
    ).toBe(false);
  });
});
