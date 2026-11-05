import { useContact } from "@features/contacts/hooks/use-contacts";
import { ContactsApiClient } from "@features/contacts/api-client/contacts-api-client";
import { useCurrentClient } from "@features/clients/state/use-clients";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Invoices } from "../types/types";
import {
  isContactConcernedByEInvoicing,
  isContactReady,
} from "@/features/contacts/configuration";
import { useEInvoicingConfig } from "@/features/e-invoicing/hooks/use-e-invoicing-config";

/**
 * Hook to check if the supplier or client is ready for e-invoicing.
 * Returns whether the invoice can proceed with e-invoice related actions.
 *
 * Note: We only check the supplier/client, not the contact person.
 */
// Contacts already checked again during this session (the hook is used by
// several components of the same document)
const refreshedContacts = new Set<string>();

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

  // The e-invoicing status of a contact is only computed when its SIREN
  // changes: when it is not active, check it again in the directory
  // (orange status, never when there is no SIREN)
  const { client } = useCurrentClient();
  const queryClient = useQueryClient();
  const shouldRefresh =
    !!client?.id &&
    !!contact?.id &&
    !!contact.business_registered_id &&
    !contact.e_invoices_active &&
    isContactConcernedByEInvoicing(contact);
  useEffect(() => {
    if (!shouldRefresh || !contact?.id || !client?.id) return;
    const key = `${client.id}:${contact.id}`;
    if (refreshedContacts.has(key)) return;
    refreshedContacts.add(key);
    ContactsApiClient.refreshEInvoicesStatus(client.id, contact.id)
      .then((result) => {
        if (result?.updated) {
          queryClient.invalidateQueries({ queryKey: ["contacts"] });
        }
      })
      .catch(() => refreshedContacts.delete(key));
  }, [shouldRefresh, contact?.id, client?.id]);

  // Customer abroad or private individual: no e-invoice, never blocked
  const concerned = !contact || isContactConcernedByEInvoicing(contact);

  // E-invoices are sent automatically for this document
  const sendEnabled =
    eInvoicingConfig?.connection_status === "connected" &&
    !!eInvoicingConfig?.send_enabled &&
    !isSupplierInvoice &&
    concerned;

  return {
    isReady,
    isPending,
    contact,
    concerned,
    sendEnabled,
    // Sending the document is refused when its e-invoice can't be sent
    enforced: sendEnabled && !!eInvoicingConfig?.send_blocking,
    missingReason: !isReady
      ? `${isSupplierInvoice ? "Le fournisseur" : "Le client"} ne possède pas de SIRET valide.`
      : undefined,
  };
};
