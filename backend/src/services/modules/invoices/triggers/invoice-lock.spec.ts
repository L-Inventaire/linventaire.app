import { describe, expect, test } from "@jest/globals";
import Invoices from "../entities/invoices";
import { getInvoiceLockViolation } from "./invoice-lock";

const invoice = (data: Partial<Invoices>) =>
  ({ id: "a1", type: "invoices", state: "sent", ...data } as Partial<Invoices>);

describe("invoice-lock", () => {
  test("draft invoices and credit notes are not locked", () => {
    const prev = invoice({ state: "draft" });
    expect(getInvoiceLockViolation(null, prev)).toBeNull();
    expect(
      getInvoiceLockViolation(invoice({ restored_from: 12 as any }), prev)
    ).toBeNull();
    expect(
      getInvoiceLockViolation(
        invoice({ type: "credit_notes", state: "draft" }),
        invoice({ type: "credit_notes", state: "draft" })
      )
    ).toBeNull();
  });

  test("creation is not locked", () => {
    expect(getInvoiceLockViolation(invoice({}), null)).toBeNull();
  });

  test("other document types are not locked", () => {
    for (const type of [
      "quotes",
      "supplier_invoices",
      "supplier_credit_notes",
      "supplier_quotes",
    ] as Invoices["type"][]) {
      const prev = invoice({ type, state: "sent" });
      expect(getInvoiceLockViolation(null, prev)).toBeNull();
      expect(
        getInvoiceLockViolation(invoice({ type, state: "draft" }), prev)
      ).toBeNull();
    }
  });

  test("sent invoices and credit notes can still evolve", () => {
    for (const type of ["invoices", "credit_notes"] as Invoices["type"][]) {
      const prev = invoice({ type, state: "sent", restored_from: 12 as any });
      expect(
        getInvoiceLockViolation(invoice({ type, state: "closed" }), prev)
      ).toBeNull();
      expect(
        getInvoiceLockViolation(
          invoice({ type, state: "sent", restored_from: "12" as any }),
          prev
        )
      ).toBeNull();
    }
  });

  test("non draft invoices and credit notes are locked", () => {
    for (const type of ["invoices", "credit_notes"] as Invoices["type"][]) {
      for (const state of [
        "sent",
        "completed",
        "closed",
      ] as Invoices["state"][]) {
        const prev = invoice({ type, state });
        // Back to draft
        expect(
          getInvoiceLockViolation(invoice({ type, state: "draft" }), prev)
        ).not.toBeNull();
        // Deletion
        expect(getInvoiceLockViolation(null, prev)).not.toBeNull();
        // Restoration of a previous version
        expect(
          getInvoiceLockViolation(
            invoice({ type, state, restored_from: 12 as any }),
            prev
          )
        ).not.toBeNull();
        // Type change
        expect(
          getInvoiceLockViolation(invoice({ type: "quotes", state }), prev)
        ).not.toBeNull();
      }
    }
  });
});
