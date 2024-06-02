import { Button } from "@atoms/button/button";
import { DocumentBar } from "@components/document-bar";
import { PageLoader } from "@components/page-loader";
import { withModel } from "@components/search-bar/utils/as-model";
import { useInvoice } from "@features/invoices/hooks/use-invoices";
import { ROUTES, getRoute } from "@features/routes";
import { Page } from "@views/client/_layout/page";
import { useParams } from "react-router-dom";
import { InvoicesDetailsPage } from "../components/invoices-details";

export const InvoicesViewPage = ({ readonly }: { readonly?: boolean }) => {
  const { id } = useParams();
  const { invoice, isPending } = useInvoice(id || "");

  if (!invoice) return <PageLoader />;

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
          backRoute={ROUTES.Invoices}
          editRoute={ROUTES.InvoicesEdit}
          suffix={
            <>
              {invoice.type === "quotes" && (
                <Button
                  size="xs"
                  shortcut={["f"]}
                  to={withModel(getRoute(ROUTES.InvoicesEdit, { id: "new" }), {
                    ...invoice,
                    type: "invoices",
                  })}
                >
                  Facturer
                </Button>
              )}
              {invoice.type === "invoices" && (
                <Button
                  size="xs"
                  theme="outlined"
                  shortcut={["shift+a"]}
                  to={withModel(getRoute(ROUTES.InvoicesEdit, { id: "new" }), {
                    ...invoice,
                    type: "credit_notes",
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
