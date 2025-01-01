import { Button } from "@atoms/button/button";
import { PageLoader } from "@atoms/page-loader";
import { DocumentBar } from "@components/document-bar";
import { withModel } from "@components/search-bar/utils/as-model";
import { useInvoice } from "@features/invoices/hooks/use-invoices";
import { getDocumentNamePlurial } from "@features/invoices/utils";
import { ROUTES, getRoute } from "@features/routes";
import { Page } from "@views/client/_layout/page";
import { useNavigate, useParams } from "react-router-dom";
import { InvoicesDetailsPage } from "../components/invoices-details";
import { getPdfPreview } from "../components/invoices-preview/invoices-preview";
import { InvoiceActions } from "../components/invoice-actions";
import { NotFound } from "@atoms/not-found/not-found";
import { useHasAccess } from "@features/access";

export const InvoicesViewPage = (_props: { readonly?: boolean }) => {
  const { id } = useParams();
  const { invoice, isPending, remove, restore, isPendingModification } =
    useInvoice(id || "");
  const isRevision = id?.includes("~");
  const navigate = useNavigate();
  const { client: clientId } = useParams();
  const hasAccess = useHasAccess();

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

  // Invoices has a special access right system
  const hasWriteType =
    invoice.type === "invoices" || invoice.type === "credit_notes"
      ? hasAccess("INVOICES_WRITE")
      : invoice.type === "quotes"
      ? hasAccess("QUOTES_WRITE")
      : invoice.type === "supplier_invoices" ||
        invoice.type === "supplier_credit_notes"
      ? hasAccess("SUPPLIER_INVOICES_WRITE")
      : hasAccess("SUPPLIER_QUOTES_WRITE");

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
      bar={
        <DocumentBar
          loading={isPending && !invoice}
          entity={"invoices"}
          document={invoice || { id }}
          mode={"read"}
          backRoute={getRoute(ROUTES.Invoices, { type: invoice.type })}
          editRoute={hasWriteType ? ROUTES.InvoicesEdit : undefined}
          viewRoute={ROUTES.InvoicesView}
          onPrint={async () => getPdfPreview(invoice)}
          onRemove={
            invoice?.id && invoice?.state === "draft" && hasWriteType
              ? async () => remove.mutateAsync(invoice?.id)
              : undefined
          }
          onRestore={
            invoice?.id && hasWriteType
              ? async () => restore.mutateAsync(invoice?.id)
              : undefined
          }
          suffix={
            hasWriteType ? (
              <>
                {invoice.type === "quotes" &&
                  (invoice.content ?? []).some(
                    (line) =>
                      line.type === "product" || line.type === "consumable"
                  ) && (
                    <>
                      <Button
                        theme="outlined"
                        size="sm"
                        shortcut={["f"]}
                        onClick={() => {
                          navigate(
                            getRoute(ROUTES.FurnishQuotes, {
                              client: clientId,
                              id,
                            })
                          );
                        }}
                      >
                        Fournir les produits
                      </Button>
                    </>
                  )}
                {invoice.type === "invoices" && (
                  <Button
                    size="sm"
                    theme="outlined"
                    shortcut={["shift+a"]}
                    disabled={["draft"].includes(invoice.state)}
                    to={withModel(
                      getRoute(ROUTES.InvoicesEdit, { id: "new" }),
                      {
                        ...invoice,
                        from_rel_quote: [invoice.from_rel_quote],
                        from_rel_invoice: [invoice.id],
                        type: "credit_notes",
                        state: "draft",
                        id: "",
                      }
                    )}
                  >
                    Créer un avoir
                  </Button>
                )}
              </>
            ) : undefined
          }
        />
      }
    >
      <InvoicesDetailsPage readonly={true} id={id || ""} />
    </Page>
  );
};
