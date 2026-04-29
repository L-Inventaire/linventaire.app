import { NotFound } from "@atoms/not-found/not-found";
import { PageLoader } from "@atoms/page-loader";
import { useParamsOrContextId } from "@features/ctrlk";
import { useReceivedEInvoice } from "@/features/e-invoicing/hooks/use-received-e-invoices";
import { getRoute, ROUTES } from "@features/routes";
import { Page } from "@views/client/_layout/page";
import { ReceivedEInvoiceActions } from "./received-invoice-actions";
import { ReceivedEInvoiceDetails } from "./received-invoice-details";

export const ReceivedEInvoiceViewPage = () => {
  const { id } = useParamsOrContextId();
  const { receivedEInvoice, items } = useReceivedEInvoice(id || "");
  const isPending = items.isPending;

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
      footer={<ReceivedEInvoiceActions id={id} invoice={receivedEInvoice} />}
    >
      <div className="mt-6" />
      <ReceivedEInvoiceDetails invoice={receivedEInvoice} />
    </Page>
  );
};
