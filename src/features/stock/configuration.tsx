import { Unit } from "@atoms/input/input-unit";
import { Base } from "@atoms/text";
import { RestDocumentsInput } from "@components/input-rest";
import { TagsInput } from "@components/input-rest/tags";
import { UsersInput } from "@components/input-rest/users";
import { useArticle } from "@features/articles/hooks/use-articles";
import { Articles } from "@features/articles/types/types";
import { getContactName } from "@features/contacts/types/types";
import { registerCtrlKRestEntity } from "@features/ctrlk";
import { ROUTES } from "@features/routes";
import { formatNumber } from "@features/utils/format/strings";
import { MapPinIcon, UserIcon } from "@heroicons/react/16/solid";
import { Column } from "@molecules/table/table";
import { Badge } from "@radix-ui/themes";
import { getArticleIcon } from "@views/client/modules/articles/components/article-icon";
import { StockItemsDetailsPage } from "@views/client/modules/stock/components/stock-item-details";
import { StockItemStatus } from "@views/client/modules/stock/components/stock-item-status";
import { useTranslation } from "react-i18next";
import { useStockLocations } from "./hooks/use-stock-locations";
import { StockItems, StockLocations } from "./types/types";

export const useStockItemDefaultModel: () => Partial<StockItems> = () => ({});

export const StockItemsColumns: Column<StockItems>[] = [
  {
    thClassName: "w-1",
    title: "Numéro de série",
    render: (item) => (
      <Base className="opacity-50 whitespace-nowrap">{item.serial_number}</Base>
    ),
  },
  {
    title: "Article",
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
    title: "Étiquettes",
    thClassName: "w-1",
    cellClassName: "justify-end",
    headClassName: "justify-end",
    render: (item) => (
      <div className="space-x-2">
        <TagsInput value={item.tags} disabled />
        <UsersInput value={item.assigned} disabled />
      </div>
    ),
  },
  {
    title: "Localisation",
    thClassName: "w-1",
    cellClassName: "justify-end",
    render: (item) => (
      <div className="space-x-2">
        {item.location && (
          <RestDocumentsInput
            entity="stock_locations"
            value={item.location}
            icon={(p) => <MapPinIcon {...p} />}
            size="sm"
            disabled
          />
        )}
        {item.client && (
          <RestDocumentsInput
            entity="contacts"
            value={item.client}
            icon={(p) => <UserIcon {...p} />}
            render={(c) => getContactName(c)}
            size="sm"
            disabled
          />
        )}
      </div>
    ),
  },
  {
    title: "Quantité",
    thClassName: "w-1",
    cellClassName: "justify-end",
    headClassName: "justify-end",
    render: (item) => <Quantity item={item} />,
  },
  {
    title: "Statut",
    thClassName: "w-1",
    cellClassName: "justify-end",
    headClassName: "justify-end",
    render: (item) => <StockItemStatus size="sm" readonly value={item.state} />,
  },
];

const Quantity = (props: { item: StockItems }) => {
  const { article } = useArticle(props.item.article);
  return (
    <Badge className="whitespace-nowrap">
      {formatNumber(props.item.quantity)} <Unit unit={article?.unit} />
    </Badge>
  );
};

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
  renderResult: StockLocationsColumns,
  useDefaultData: useStockLocationDefaultModel,
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
