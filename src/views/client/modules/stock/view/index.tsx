import { PageLoader } from "@atoms/page-loader";
import { DocumentBar } from "@components/document-bar";
import { ROUTES, getRoute } from "@features/routes";
import { useStockItem } from "@features/stock/hooks/use-stock-items";
import { Page } from "@views/client/_layout/page";
import { useParams } from "react-router-dom";
import { StockItemsDetailsPage } from "../components/stock-item-details";

export const StockItemsViewPage = (_props: { readonly?: boolean }) => {
  const { id } = useParams();
  const {
    stock_item: item,
    isPending,
    remove,
    restore,
  } = useStockItem(id || "");

  if (!item)
    return (
      <div className="flex justify-center items-center h-full w-full dark:bg-slate-990 bg-white">
        <PageLoader />
      </div>
    );

  return (
    <Page
      title={[
        { label: "StockItems", to: getRoute(ROUTES.Stock) },
        { label: item.serial_number || "" },
      ]}
      bar={
        <DocumentBar
          loading={isPending && !item}
          entity={"stock_items"}
          document={item || { id }}
          mode={"read"}
          backRoute={ROUTES.Stock}
          editRoute={ROUTES.StockEdit}
          viewRoute={ROUTES.StockView}
          prefix={<></>}
          suffix={<></>}
          onRemove={
            item?.id ? async () => remove.mutateAsync(item?.id) : undefined
          }
          onRestore={
            item?.id ? async () => restore.mutateAsync(item?.id) : undefined
          }
        />
      }
    >
      <StockItemsDetailsPage readonly={true} id={id || ""} />
    </Page>
  );
};
