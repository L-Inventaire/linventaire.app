import { Button } from "@atoms/button/button";
import { Base } from "@atoms/text";
import { RestDocumentsInput } from "@components/input-rest";
import { Articles } from "@features/articles/types/types";
import { getContactName } from "@features/contacts/types/types";
import { registerCtrlKRestEntity } from "@features/ctrlk";
import { ROUTES } from "@features/routes";
import { formatNumber } from "@features/utils/format/strings";
import { UserIcon } from "@heroicons/react/16/solid";
import { Column } from "@molecules/table/table";
import { getArticleIcon } from "@views/client/modules/articles/components/article-icon";
import { StockItemsDetailsPage } from "@views/client/modules/stock/components/stock-item-details";
import { StockItemStatus } from "@views/client/modules/stock/components/stock-item-status";
import { StockLocationsDetailsPage } from "@views/client/modules/stock/components/stock-location-details";
import { useTranslation } from "react-i18next";
import { useStockLocations } from "./hooks/use-stock-locations";
import { StockItems, StockLocations } from "./types/types";

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

export const StockLocationsColumns: Column<StockLocations>[] = [
  {
    thClassName: "w-24 whitespace-nowrap",
    title: "Parent",
    render: (stockLocation) => <StockParent id={stockLocation.parent} />,
  },
  {
    thClassName: "w-24 whitespace-nowrap",
    title: "Type",
    render: (stockLocation) => <LocationType type={stockLocation?.type} />,
  },
  {
    title: "Nom",
    render: (stockLocation) => <>{stockLocation.name}</>,
  },
];

registerCtrlKRestEntity<StockLocations>("stock_locations", {
  renderEditor: (props) => (
    <StockLocationsDetailsPage readonly={false} id={props.id} />
  ),
  renderResult: StockLocationsColumns,
  useDefaultData: useStockLocationDefaultModel,
  viewRoute: ROUTES.StockView,
});

const StockParent = ({ id }: { id: string }) => {
  const { stock_locations: data } = useStockLocations();
  const parent = data?.data?.list.find((l) => l.id === id);
  return <>{parent?.name || "-"}</>;
};

const LocationType = ({ type }: { type: StockLocations["type"] }) => {
  const { t } = useTranslation();
  return <>{t("stock.locations.type." + type)}</>;
};
