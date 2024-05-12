import { Button } from "@atoms/button/button";
import { Title } from "@atoms/text";
import { PageLoader } from "@components/page-loader";
import { useInvoice } from "@features/invoices/hooks/use-invoices";
import { ROUTES, getRoute } from "@features/routes";
import { Page } from "@views/client/_layout/page";
import { useNavigate, useParams } from "react-router-dom";
import { InvoicesDetailsPage } from "../components/invoices-details";

export const InvoicesViewPage = ({ readonly }: { readonly?: boolean }) => {
  const { id } = useParams();
  const { invoice } = useInvoice(id || "");
  const navigate = useNavigate();

  if (!invoice) return <PageLoader />;

  return (
    <Page
      title={[
        { label: "Invoices", to: getRoute(ROUTES.Invoices) },
        { label: invoice.name || "" },
      ]}
    >
      <div className="float-right space-x-2">
        <Button
          onClick={async () => navigate(getRoute(ROUTES.InvoicesEdit, { id }))}
        >
          Modifier
        </Button>
      </div>
      <Title>{invoice.name || ""}</Title>
      <div className="mt-4" />
      <InvoicesDetailsPage readonly={true} id={id || ""} />
    </Page>
  );
};
