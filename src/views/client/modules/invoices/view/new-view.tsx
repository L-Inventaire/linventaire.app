import { NotFound } from "@atoms/not-found/not-found";
import { PageLoader } from "@atoms/page-loader";
import { useInvoice } from "@features/invoices/hooks/use-invoices";
import { getDocumentNamePlurial } from "@features/invoices/utils";
import { ROUTES, getRoute } from "@features/routes";
import { NewPage } from "@views/client/_layout/new-page";
import { useParams } from "react-router-dom";
import { InvoicesDetailsPage } from "../components/invoices-details";
import { InvoiceTitleContent } from "../components/title-content";

export const NewInvoicesViewPage = (_props: { readonly?: boolean }) => {
  const { id } = useParams();
  const { invoice, isPending } = useInvoice(id || "");

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

  const readonly = _props.readonly || true;

  return (
    <NewPage
      title={{
        items: [
          {
            label: getDocumentNamePlurial(invoice.type),
            to: getRoute(ROUTES.Invoices, { type: invoice.type }),
          },
          { label: invoice.reference || "" },
        ],
        render: <InvoiceTitleContent id={id || ""} readonly={readonly} />,
      }}
    >
      <InvoicesDetailsPage readonly={true} id={id || ""} />
    </NewPage>
  );
};
