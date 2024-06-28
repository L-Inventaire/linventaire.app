import { registerCtrlKRestEntity } from "@features/ctrlk";
import { ROUTES } from "@features/routes";
import { StockItemsDetailsPage } from "@views/client/modules/stock/components/stock-item-details";
import { StockItems } from "./types/types";

export const useStockItemDefaultModel: () => Partial<StockItems> = () => ({});

registerCtrlKRestEntity<StockItems>(
  "stock_items",
  (props) => <StockItemsDetailsPage readonly={false} id={props.id} />,
  (item) => <>{item.article}</>,
  useStockItemDefaultModel,
  ROUTES.StockView
);
