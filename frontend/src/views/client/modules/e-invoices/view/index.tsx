import { Contacts } from "@/features/contacts/types/types";
import { useReceivedEInvoice } from "@/features/e-invoicing/hooks/use-received-e-invoices";
import { NotFound } from "@atoms/not-found/not-found";
import { PageLoader } from "@atoms/page-loader";
import { useParamsOrContextId } from "@features/ctrlk";
import { getRoute, ROUTES } from "@features/routes";
import { Page } from "@views/client/_layout/page";
import { useState } from "react";
import { ReceivedEInvoiceActions } from "./received-invoice-actions";
import { ReceivedEInvoiceContent } from "./received-invoice-content";

export const ReceivedEInvoiceViewPage = () => {
  const { id } = useParamsOrContextId();
  const { receivedEInvoice, items } = useReceivedEInvoice(id || "");
  const isPending = items.isPending;
  const [supplier, setSupplier] = useState<Contacts | null>(null);

  // Extract seller's business_registered_id from EN16931 invoice
  const sellerRegistrationId =
    receivedEInvoice?.en_invoice?.seller?.legal_registration_identifier?.value;

  // Check if supplier is valid (has matching business_registered_id)
  const isSupplierValid =
    supplier &&
    sellerRegistrationId &&
    supplier.business_registered_id === sellerRegistrationId;

  if (!receivedEInvoice && isPending)
    return (
      <div className="flex justify-center items-center h-full w-full dark:bg-slate-990 bg-white">
        <PageLoader />
      </div>
    );

  if (!receivedEInvoice && !isPending) {
    return (
      <div className="flex justify-center items-center h-full w-full dark:bg-slate-990 bg-white">
        <NotFound />
      </div>
    );
  }

  if (!receivedEInvoice) {
    return <></>;
  }

  return (
    <Page
      loading={isPending}
      title={[
        {
          label: "Factures électroniques reçues",
          to: getRoute(ROUTES.ReceivedEInvoices),
        },
        { label: receivedEInvoice.invoice_number || "" },
      ]}
      footer={
        <ReceivedEInvoiceActions
          id={id}
          invoice={receivedEInvoice}
          supplier={supplier}
          isSupplierValid={!!isSupplierValid}
        />
      }
    >
      <ReceivedEInvoiceContent
        invoice={receivedEInvoice}
        supplier={supplier}
        setSupplier={setSupplier}
        isSupplierValid={!!isSupplierValid}
      />
    </Page>
  );
};
