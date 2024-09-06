import { registerCtrlKRestEntity } from "@features/ctrlk";
import { ROUTES } from "@features/routes";
import { StockItemsDetailsPage } from "@views/client/modules/stock/components/stock-item-details";
import { StockLocationsDetailsPage } from "@views/client/modules/stock/components/stock-location-details";
import { StockItems, StockLocations } from "./types/types";
import { Column } from "@molecules/table/table";
import { Base } from "@atoms/text";
import { RestDocumentsInput } from "@components/input-rest";
import { getArticleIcon } from "@views/client/modules/articles/components/article-icon";
import { Articles } from "@features/articles/types/types";
import { UserIcon } from "@heroicons/react/16/solid";
import { getContactName } from "@features/contacts/types/types";
import { formatNumber } from "@features/utils/format/strings";
import { StockItemStatus } from "@views/client/modules/stock/components/stock-item-status";
import { Button } from "@atoms/button/button";

export const useStockItemDefaultModel: () => Partial<StockItems> = () => ({});

export const StockItemsColumns: Column<StockItems>[] = [
  {
    thClassName: "w-1",
    render: (item) => (
      <Base className="opacity-50 whitespace-nowrap">{item.serial_number}</Base>
    ),
  },
  {
    render: (item) => (
      <RestDocumentsInput
        disabled
        value={item.article}
        entity={"articles"}
        size="sm"
        icon={(p, article) => getArticleIcon((article as Articles)?.type)(p)}
      />
    ),
  },
  {
    thClassName: "w-1",
    cellClassName: "justify-end",
    render: (item) => (
      <>
        <RestDocumentsInput
          label="Fournisseur"
          placeholder="Aucun fournisseur"
          entity="contacts"
          value={item.client}
          icon={(p) => <UserIcon {...p} />}
          render={(c) => getContactName(c)}
          size="sm"
          disabled
        />
      </>
    ),
  },
  {
    thClassName: "w-1",
    cellClassName: "justify-end",
    render: (item) => (
      <Button size="sm" theme="outlined">
        {formatNumber(item.quantity || 0)}
        {" / "}
        {formatNumber(item.original_quantity || 0)}
      </Button>
    ),
  },
  {
    thClassName: "w-1",
    cellClassName: "justify-end",
    render: (item) => <StockItemStatus size="sm" readonly value={item.state} />,
  },
];

registerCtrlKRestEntity<StockItems>("stock_items", {
  renderEditor: (props) => (
    <StockItemsDetailsPage readonly={false} id={props.id} />
  ),
  renderResult: StockItemsColumns,
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
