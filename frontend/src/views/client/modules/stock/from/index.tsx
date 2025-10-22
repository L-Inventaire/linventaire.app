import { DocumentBar } from "@components/document-bar";
import { useCurrentClient } from "@features/clients/state/use-clients";
import { ROUTES, getRoute } from "@features/routes";
import { StockApiClient } from "@features/stock/api-client/stock-api-client";
import { StockItems } from "@features/stock/types/types";
import { Button } from "@radix-ui/themes";
import { Page } from "@views/client/_layout/page";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { StockItemsCreateFromOrder } from "../components/stock-item-create-from-order";
import { StockItemsCreateFromSupplier } from "../components/stock-item-create-from-supplier";

export const StockItemsFromPage = (_props: { readonly?: boolean }) => {
  const { id: clientId } = useCurrentClient();
  const { from, id } = useParams();
  const navigate = useNavigate();
  const [stockItems, setStockItems] = useState<StockItems[]>([]);
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
      <div className="w-full max-w-4xl mx-auto space-y-6 mt-4">
        <div className={loading ? "opacity-50 pointer-events-none" : ""}>
          {from === "order" && (
            <StockItemsCreateFromOrder
              loading={loading}
              order={id!}
              onBack={() => navigate(getRoute(ROUTES.StockEdit, { id: "new" }))}
              onChange={setStockItems}
            />
          )}
          {from === "supplier" && (
            <StockItemsCreateFromSupplier
              loading={loading}
              supplier={id!}
              onBack={() => navigate(getRoute(ROUTES.StockEdit, { id: "new" }))}
              onChange={setStockItems}
            />
          )}
        </div>

        <Button
          loading={loading}
          className="float-right"
          disabled={!stockItems.length}
          onClick={async () => {
            setLoading(true);
            try {
              // Multiple import as once:
              await StockApiClient.importMultiple(clientId!, stockItems);
              toast.success("Les éléments ont été ajoutés dans le stock");
              if (from === "order") {
                navigate(
                  getRoute(ROUTES.Invoices, { type: "supplier_quotes" })
                );
              } else {
                navigate(getRoute(ROUTES.Stock));
              }
            } catch (e) {
              setLoading(false);
              toast.error(
                "Une erreur est survenue lors de l'import des éléments dans le stock"
              );
              alert(
                "Nous sommes désolé, une erreur est survenue lors de la réception. Il est possible qu'une partie des éléments ait été ajoutés comme prévu, vérifiez les alertes afin de ne pas réimporter des éléments en double. Contactez le support si le problème persiste."
              );
              console.error(e);
            }
            setLoading(false);
          }}
        >
          Ajouter {stockItems.length} éléments dans le stock
        </Button>
      </div>
    </Page>
  );
};
