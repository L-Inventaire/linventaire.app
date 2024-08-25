import { registerCtrlKRestEntity } from "@features/ctrlk";
import { ROUTES } from "@features/routes";
import { StockItemsDetailsPage } from "@views/client/modules/stock/components/stock-item-details";
import { StockLocationsDetailsPage } from "@views/client/modules/stock/components/stock-location-details";
import { StockItems, StockLocations } from "./types/types";

export const useStockItemDefaultModel: () => Partial<StockItems> = () => ({});

registerCtrlKRestEntity<StockItems>("stock_items", {
  renderEditor: (props) => (
    <StockItemsDetailsPage readonly={false} id={props.id} />
  ),
  renderResult: [{ render: (item) => <>{item.article}</> }],
  useDefaultData: useStockItemDefaultModel,
  viewRoute: ROUTES.StockView,
});

export const useStockLocationDefaultModel: () => Partial<StockLocations> =
  () => ({});

registerCtrlKRestEntity<StockLocations>("stock_locations", {
  renderEditor: (props) => (
    <StockLocationsDetailsPage readonly={false} id={props.id} />
  ),
  renderResult: [{ render: (item) => <>{item.name}</> }],
  useDefaultData: useStockLocationDefaultModel,
  viewRoute: ROUTES.StockView,
});
