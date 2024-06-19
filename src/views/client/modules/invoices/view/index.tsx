import { Button } from "@atoms/button/button";
import { DocumentBar } from "@components/document-bar";
import { PageLoader } from "@components/page-loader";
import { withModel } from "@components/search-bar/utils/as-model";
import { useInvoice } from "@features/invoices/hooks/use-invoices";
import { ROUTES, getRoute } from "@features/routes";
import { Page } from "@views/client/_layout/page";
import { useParams } from "react-router-dom";
import { InvoiceStatus } from "../components/invoice-status";
import { InvoicesDetailsPage } from "../components/invoices-details";
import { getPdfPreview } from "../components/invoices-preview/invoices-preview";

export const InvoicesViewPage = ({ readonly }: { readonly?: boolean }) => {
  const { id } = useParams();
  const { invoice, isPending, update } = useInvoice(id || "");

  if (!invoice)
    return (
      <div className="flex justify-center items-center h-full w-full dark:bg-wood-990 bg-white">
        <PageLoader />
      </div>
    );

  return (
    <Page
      title={[
        { label: "Invoices", to: getRoute(ROUTES.Invoices) },
        { label: invoice.reference || "" },
      ]}
      bar={
        <DocumentBar
          loading={isPending && !invoice}
          document={invoice || { id }}
          mode={"read"}
          backRoute={getRoute(ROUTES.Invoices, { type: invoice.type })}
          editRoute={ROUTES.InvoicesEdit}
          onPrint={async () => getPdfPreview()}
          prefix={
            <>
              <InvoiceStatus
                size="lg"
                readonly={update.isPending}
                value={invoice.state}
                type={invoice.type}
                onChange={(e) => update.mutate({ ...invoice, state: e })}
              />
            </>
          }
          suffix={
            <>
              {invoice.type === "quotes" && (
                <>
                  <Button
                    theme="outlined"
                    size="xs"
                    shortcut={["c"]}
                    to={withModel(
                      getRoute(ROUTES.InvoicesEdit, { id: "new" }),
                      {
                        //TODO
                      }
                    )}
                  >
                    Créer une commande
                  </Button>
                  <Button
                    size="xs"
                    shortcut={["f"]}
                    to={withModel(
                      getRoute(ROUTES.InvoicesEdit, { id: "new" }),
                      {
                        ...invoice,
                        type: "invoices",
                        state: "draft",
                      }
                    )}
                  >
                    Facturer
                  </Button>
                </>
              )}
              {invoice.type === "invoices" && (
                <Button
                  size="xs"
                  theme="outlined"
                  shortcut={["shift+a"]}
                  to={withModel(getRoute(ROUTES.InvoicesEdit, { id: "new" }), {
                    ...invoice,
                    type: "credit_notes",
                    state: "draft",
                  })}
                >
                  Créer un avoir
                </Button>
              )}
            </>
          }
        />
      }
    >
      <InvoicesDetailsPage readonly={true} id={id || ""} />
    </Page>
  );
};
