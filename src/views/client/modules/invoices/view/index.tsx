import { Button } from "@atoms/button/button";
import { Section, Title } from "@atoms/text";
import { PageLoader } from "@components/page-loader";
import { useInvoice } from "@features/invoices/hooks/use-invoices";
import { ROUTES, getRoute } from "@features/routes";
import { Page, PageBlockHr } from "@views/client/_layout/page";
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
        { label: invoice.reference || "" },
      ]}
    >
      <div className="float-right space-x-2">
        <Button
          size="sm"
          onClick={async () => navigate(getRoute(ROUTES.InvoicesEdit, { id }))}
        >
          Modifier
        </Button>
      </div>
      <Section>{invoice.reference || ""}</Section>
      <div className="mt-4" />
      <InvoicesDetailsPage type="quotes" readonly={true} id={id || ""} />
    </Page>
  );
};
