import { registerCtrlKRestEntity } from "@features/ctrlk";
import { ROUTES } from "@features/routes";
import { StockItemsDetailsPage } from "@views/client/modules/stock/components/stock-item-details";
import { StockItems } from "./types/types";

export const useStockItemDefaultModel: () => Partial<StockItems> = () => ({});

registerCtrlKRestEntity<StockItems>("stock_items", {
  renderEditor: (props) => (
    <StockItemsDetailsPage readonly={false} id={props.id} />
  ),
  renderResult: (item) => <>{item.article}</>,
  useDefaultData: useStockItemDefaultModel,
  viewRoute: ROUTES.StockView,
});
