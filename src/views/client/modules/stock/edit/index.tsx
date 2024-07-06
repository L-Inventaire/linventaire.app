import { DocumentBar } from "@components/document-bar";
import { PageLoader } from "@atoms/page-loader";
import { useClients } from "@features/clients/state/use-clients";
import { ROUTES, getRoute } from "@features/routes";
import { useStockItemDefaultModel } from "@features/stock/configuration";
import { StockItems } from "@features/stock/types/types";
import { useDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { Page } from "@views/client/_layout/page";
import _ from "lodash";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { StockItemsDetailsPage } from "../components/stock-item-details";
import { StockItemStatus } from "../components/stock-item-status";

export const StockItemsEditPage = ({}: { readonly?: boolean }) => {
  const { refresh, loading } = useClients();

  useEffect(() => {
    refresh();
  }, []);

  let { id } = useParams();
  id = id === "new" ? "" : id || "";
  const navigate = useNavigate();

  const defaultModel = useStockItemDefaultModel();
  const initialModel = JSON.parse(
    new URLSearchParams(window.location.search).get("model") || "{}"
  ) as StockItems;

  const { isInitiating, save, draft, setDraft } = useDraftRest<StockItems>(
    "stock_items",
    id || "new",
    async (item) => {
      navigate(getRoute(ROUTES.StockView, { id: item.id }));
    },
    _.omit(_.merge(defaultModel, initialModel), "reference") as StockItems
  );

  return (
    <Page
      title={[
        { label: "Stock", to: getRoute(ROUTES.Stock) },
        { label: id ? "Modifier" : "Créer" },
      ]}
      bar={
        <DocumentBar
          loading={isInitiating || loading}
          entity={"stock_items"}
          document={{ id }}
          mode={"write"}
          onSave={async () => await save()}
          backRoute={ROUTES.Stock}
          viewRoute={ROUTES.StockView}
          editRoute={ROUTES.StockEdit}
          prefix={
            <>
              {!draft.id && (
                <>
                  <span>Nouvel élément en l'état</span>
                </>
              )}
            </>
          }
        />
      }
    >
      {isInitiating ? (
        <PageLoader />
      ) : (
        <StockItemsDetailsPage readonly={false} id={id} />
      )}
    </Page>
  );
};
