import { DocumentBar } from "@components/document-bar";
import { useInvoices } from "@features/invoices/hooks/use-invoices";
import { ROUTES, getRoute } from "@features/routes";
import { Button } from "@radix-ui/themes";
import { Page } from "@views/client/_layout/page";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

export const QuoteFromItems = (_props: { readonly?: boolean }) => {
  const { from, id } = useParams();
  const navigate = useNavigate();
  const { upsert } = useInvoices();
  const [loading, setLoading] = useState(false);
  return (
    <Page
      title={[
        { label: "Stock", to: getRoute(ROUTES.Stock) },
        { label: "Créer" },
      ]}
      bar={
        <DocumentBar
          entity={"stock_items"}
          document={{}}
          mode={"write"}
          backRoute={getRoute(ROUTES.StockEdit, { id: "new" })}
        />
      }
    >
      <div className="w-full max-w-3xl mx-auto space-y-6 mt-4">
        <Button
          loading={loading}
          className="float-right"
          disabled={false}
          onClick={async () => {
            setLoading(true);
            //TODO
            toast.success("Les éléments ont été ajoutés dans le stock");
            setLoading(false);
            navigate(getRoute(ROUTES.Invoices));
          }}
        >
          Créer la facture
        </Button>
      </div>
    </Page>
  );
};
