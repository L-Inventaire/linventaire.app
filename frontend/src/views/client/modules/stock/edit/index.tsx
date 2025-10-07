import { PageLoader } from "@atoms/page-loader";
import { DocumentBar } from "@components/document-bar";
import { getUrlModel } from "@components/search-bar/utils/as-model";
import { useClients } from "@features/clients/state/use-clients";
import { useParamsOrContextId } from "@features/ctrlk";
import { ROUTES, getRoute } from "@features/routes";
import { useStockItemDefaultModel } from "@features/stock/configuration";
import { StockItems } from "@features/stock/types/types";
import { useDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { Page } from "@views/client/_layout/page";
import _ from "lodash";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { StockItemsDetailsPage } from "../components/stock-item-details";

export const StockItemsEditPage = (_props: { readonly?: boolean }) => {
  const { refresh, loading } = useClients();

  useEffect(() => {
    refresh();
  }, []);

  let { id } = useParamsOrContextId();
  id = id === "new" ? "" : id || "";
  const navigate = useNavigate();

  const defaultModel = useRef(useStockItemDefaultModel()).current;
  const initialModel = getUrlModel<StockItems>();

  const { isInitiating, save, remove, restore, draft, isPendingModification } =
    useDraftRest<StockItems>(
      "stock_items",
      id || "new",
      async (item) => {
        navigate(getRoute(ROUTES.StockView, { id: item.id }));
      },
      _.omit(_.merge({}, defaultModel, initialModel), "reference") as StockItems
    );

  return (
    <Page
      loading={isPendingModification}
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
          onRemove={draft.id ? remove : undefined}
          onRestore={draft.id ? restore : undefined}
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
