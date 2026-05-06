import { useContact } from "@features/contacts/hooks/use-contacts";
import { Invoices } from "../types/types";
import { isContactReady } from "@/features/contacts/configuration";
import { useEInvoicingConfig } from "@/features/e-invoicing/hooks/use-e-invoicing-config";

/**
 * Hook to check if the supplier or client is ready for e-invoicing.
 * Returns whether the invoice can proceed with e-invoice related actions.
 *
 * Note: We only check the supplier/client, not the contact person.
 */
export const useEInvoicesReady = (invoice?: Invoices) => {
  const { config: eInvoicingConfig } = useEInvoicingConfig();

  // Determine if this is a supplier invoice type
  const isSupplierInvoice =
    invoice?.type === "supplier_credit_notes" ||
    invoice?.type === "supplier_invoices" ||
    invoice?.type === "supplier_quotes";

  // Get the relevant contact ID (supplier for supplier invoices, client for regular invoices)
  const contactId = isSupplierInvoice ? invoice?.supplier : invoice?.client;

  // Fetch the contact
  const { contact, isPending } = useContact(contactId || "");

  // Check if e-invoicing is ready
  const isReady = contact && isContactReady(contact);

  return {
    isReady,
    isPending,
    contact,
    enforced: eInvoicingConfig?.send_enabled,
    missingReason: !isReady
      ? `${isSupplierInvoice ? "Le fournisseur" : "Le client"} ne possède pas de SIRET valide.`
      : undefined,
  };
};
