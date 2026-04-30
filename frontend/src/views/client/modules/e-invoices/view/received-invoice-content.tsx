import { buildQueryFromMap } from "@/components/search-bar/utils/utils";
import { useContacts } from "@/features/contacts/hooks/use-contacts";
import { Contacts } from "@/features/contacts/types/types";
import { ReceivedEInvoices } from "@/features/e-invoicing/types/types";
import { InvoiceRestDocument } from "@/views/client/modules/invoices/components/invoice-lines-input/invoice-input-rest-card";
import { ContactRestDocument } from "@/views/client/modules/contacts/components/contact-input-rest-card";
import { Section } from "@atoms/text";
import {
  BuildingStorefrontIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";
import { useInvoices } from "@/features/invoices/hooks/use-invoices";
import { Heading } from "@radix-ui/themes";
import { useEffect } from "react";
import { ReceivedEInvoiceDetails } from "./received-invoice-details";

export const ReceivedEInvoiceContent = ({
  invoice,
  supplier,
  setSupplier,
  isSupplierValid,
}: {
  invoice: ReceivedEInvoices;
  supplier: Contacts | null;
  setSupplier: (supplier: Contacts | null) => void;
  isSupplierValid: boolean;
}) => {
  // Extract seller's business_registered_id from EN16931 invoice
  const sellerRegistrationId =
    invoice?.en_invoice?.seller?.legal_registration_identifier?.value;

  const { contacts } = useContacts({
    query: buildQueryFromMap({
      type: "company",
      is_supplier: true,
      business_registered_id: sellerRegistrationId || "none",
    } as Partial<Contacts>),
    limit: 1,
  });

  useEffect(() => {
    if (contacts.data?.list?.length) {
      setSupplier(contacts.data?.list?.[0]);
    }
  }, [contacts.data?.list, setSupplier]);

  // Find matching invoice
  const minAmount = invoice ? invoice.total_amount * 0.9 : 0;
  const maxAmount = invoice ? invoice.total_amount * 1.1 : 0;

  const { invoices: matchingInvoices } = useInvoices({
    query: invoice?.supplier_invoice_id
      ? buildQueryFromMap({
          id: invoice.supplier_invoice_id,
        })
      : supplier
        ? [
            ...buildQueryFromMap({
              type: ["supplier_invoices", "supplier_credit_notes"],
              supplier: supplier.id,
            }),
            {
              key: "total.total",
              values: [
                { op: "gte" as const, value: minAmount },
                { op: "lte" as const, value: maxAmount },
              ],
            },
          ]
        : undefined,
    limit: 1,
  });

  const linkedInvoice = matchingInvoices.data?.list?.[0];
  const isLinked = !!invoice?.supplier_invoice_id;
  const isPotentialMatch = !isLinked && !!linkedInvoice;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <Heading size="4" className="m-0">
        {invoice.invoice_number || "Facture électronique"}
      </Heading>

      <div>
        <Section className="mb-2">Rattachement interne</Section>

        <div className="space-y-4">
          <div className="space-y-2">
            <ContactRestDocument
              value={supplier ? [supplier.id] : []}
              onChange={(_id: any, value: any) => {
                setSupplier(value[0] || null);
              }}
              max={1}
              size="xl"
              label="Fournisseur"
              icon={(p) => <BuildingStorefrontIcon {...p} />}
              query={
                sellerRegistrationId
                  ? `business_registered_id:"${sellerRegistrationId}"`
                  : ""
              }
              filter={
                {
                  is_supplier: true,
                } as Partial<Contacts>
              }
            />
            {supplier && !isSupplierValid && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium">SIREN manquant ou incorrect</p>
                  <p className="mt-1">
                    Le SIREN du fournisseur ne correspond pas à celui de la
                    facture ({sellerRegistrationId}). Veuillez mettre à jour le
                    contact avec le bon numéro SIREN.
                  </p>
                </div>
              </div>
            )}
            {!supplier && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Sélectionnez le fournisseur correspondant à cette facture
                électronique.
              </p>
            )}
          </div>

          {/* Matching Invoice Display */}
          {linkedInvoice && isLinked && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <LinkIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Rattachée à la facture interne suivante
                  </p>
                  <InvoiceRestDocument
                    value={[linkedInvoice.id]}
                    size="lg"
                    disabled
                  />
                </div>
              </div>
            </div>
          )}

          {linkedInvoice && isPotentialMatch && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MagnifyingGlassIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Cette facture peut correspondre
                  </p>
                  <InvoiceRestDocument
                    value={[linkedInvoice.id]}
                    size="lg"
                    disabled
                  />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Utilisez le bouton "Rattacher" en bas de page pour confirmer
                    le lien.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <Section className="mb-2">Données de la facture reçue</Section>
        <ReceivedEInvoiceDetails invoice={invoice} />
      </div>
    </div>
  );
};
