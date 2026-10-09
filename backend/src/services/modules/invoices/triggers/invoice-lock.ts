import Framework from "../../../../platform";
import Invoices, { InvoicesDefinition } from "../entities/invoices";

/**
 * Once an invoice or a credit note has left the draft state it has a definitive
 * number and may have been sent through the e-invoicing network: it must not be
 * possible to rewrite it afterwards. We refuse:
 * - going back to draft,
 * - deleting it,
 * - restoring one of its previous versions,
 * - changing its type (would bypass the rules above).
 */
export const getInvoiceLockViolation = (
  entity: Partial<Invoices> | null | undefined,
  prev: Partial<Invoices> | null | undefined
): string | null => {
  if (!prev || !isLockedInvoice(prev)) return null;

  if (!entity) {
    return "Une facture ou un avoir qui n'est plus en brouillon ne peut pas être supprimé.";
  }

  if (entity.type !== prev.type) {
    return "Le type d'une facture ou d'un avoir qui n'est plus en brouillon ne peut pas être modifié.";
  }

  if (entity.state === "draft") {
    return "Une facture ou un avoir qui n'est plus en brouillon ne peut pas repasser en brouillon.";
  }

  if (
    entity.restored_from &&
    String(entity.restored_from) !== String(prev.restored_from || "")
  ) {
    return "Une facture ou un avoir qui n'est plus en brouillon ne peut pas être restauré à une version antérieure.";
  }

  return null;
};

export const isLockedInvoice = (invoice: Partial<Invoices>) =>
  (invoice.type === "invoices" || invoice.type === "credit_notes") &&
  !!invoice.state &&
  invoice.state !== "draft";

export const setInvoiceLockTrigger = () =>
  Framework.TriggersManager.registerTrigger<Invoices>(InvoicesDefinition, {
    test: (_, __, prev) => !!prev && isLockedInvoice(prev),
    callback: async (_, entity, prev) => {
      // Triggers run inside the write transaction: throwing rolls it back
      const violation = getInvoiceLockViolation(entity, prev);
      if (violation) throw new Error(violation);
    },
    name: "invoice-lock",
    priority: 0, // Before any other trigger
  });
