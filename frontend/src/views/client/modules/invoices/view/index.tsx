import { NotFound } from "@atoms/not-found/not-found";
import { PageLoader } from "@atoms/page-loader";
import { useParamsOrContextId } from "@features/ctrlk";
import { useInvoice } from "@features/invoices/hooks/use-invoices";
import { getDocumentNamePlurial } from "@features/invoices/utils";
import { ROUTES, getRoute } from "@features/routes";
import { Page } from "@views/client/_layout/page";
import { InvoicesDocumentBar } from "../components/document-bar";
import { InvoiceActions } from "../components/invoice-actions";
import { InvoicesDetailsPage } from "../components/invoices-details";

export const InvoicesViewPage = (_props: { readonly?: boolean }) => {
  const { id } = useParamsOrContextId();
  const { invoice, isPending, isPendingModification } = useInvoice(id || "");
  const isRevision = id?.includes("~");

  if (!invoice && isPending)
    return (
      <div className="flex justify-center items-center h-full w-full dark:bg-slate-990 bg-white">
        <PageLoader />
      </div>
    );

  if (!invoice && !isPending) {
    return (
      <div className="flex justify-center items-center h-full w-full dark:bg-slate-990 bg-white">
        <NotFound />
      </div>
    );
  }

  if (!invoice) {
    return <></>;
  }

  return (
    <Page
      loading={isPendingModification}
      title={[
        {
          label: getDocumentNamePlurial(invoice.type),
          to: getRoute(ROUTES.Invoices, { type: invoice.type }),
        },
        { label: invoice.reference || "" },
      ]}
      footer={
        isRevision ? undefined : <InvoiceActions id={id} readonly={true} />
      }
      bar={<InvoicesDocumentBar id={id!} readonly />}
    >
      <div className="mt-6" />
      <InvoicesDetailsPage readonly={true} id={id || ""} />
    </Page>
  );
};
