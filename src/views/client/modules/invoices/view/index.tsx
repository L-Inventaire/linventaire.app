import { Button } from "@atoms/button/button";
import { Section } from "@atoms/text";
import { PageLoader } from "@components/page-loader";
import { useInvoice } from "@features/invoices/hooks/use-invoices";
import { ROUTES, getRoute } from "@features/routes";
import { Page } from "@views/client/_layout/page";
import { useNavigate, useParams } from "react-router-dom";
import { InvoicesDetailsPage } from "../components/invoices-details";
import { DocumentBar } from "@components/document-bar";

export const InvoicesViewPage = ({ readonly }: { readonly?: boolean }) => {
  const { id } = useParams();
  const { invoice } = useInvoice(id || "");
  const navigate = useNavigate();

  if (!invoice) return <PageLoader />;

  return (
    <Page
      title={[
        { label: "Invoices", to: getRoute(ROUTES.Invoices) },
        { label: invoice.reference || "" },
      ]}
      bar={
        <DocumentBar
          document={{ id }}
          mode={"read"}
          backRoute={ROUTES.Invoices}
          editRoute={ROUTES.InvoicesEdit}
          suffix={
            <>
              {invoice.type === "quotes" && (
                <Button
                  size="xs"
                  shortcut={["f"]}
                  onClick={async () =>
                    navigate(getRoute(ROUTES.ContactsEdit || "", { id }))
                  }
                >
                  Facturer
                </Button>
              )}
              {invoice.type === "invoices" && (
                <Button
                  size="xs"
                  theme="outlined"
                  shortcut={["shift+a"]}
                  onClick={async () =>
                    navigate(getRoute(ROUTES.ContactsEdit || "", { id }))
                  }
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
