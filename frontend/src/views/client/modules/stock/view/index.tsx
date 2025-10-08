import { PageLoader } from "@atoms/page-loader";
import { DocumentBar } from "@components/document-bar";
import { useHasAccess } from "@features/access";
import { useParamsOrContextId } from "@features/ctrlk";
import { ROUTES, getRoute } from "@features/routes";
import { useStockItem } from "@features/stock/hooks/use-stock-items";
import { Page } from "@views/client/_layout/page";
import { StockItemsDetailsPage } from "../components/stock-item-details";

export const StockItemsViewPage = (_props: { readonly?: boolean }) => {
  const { id } = useParamsOrContextId();
  const {
    stock_item: item,
    isPending,
    remove,
    restore,
    isPendingModification,
  } = useStockItem(id || "");
  const hasAccess = useHasAccess();

  if (!item)
    return (
      <div className="flex justify-center items-center h-full w-full dark:bg-slate-990 bg-white">
        <PageLoader />
      </div>
    );

  return (
    <Page
      loading={isPendingModification}
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
          onRemove={
            item?.id && hasAccess("STOCK_WRITE")
              ? async () => remove.mutateAsync(item?.id)
              : undefined
          }
          onRestore={
            item?.id && hasAccess("STOCK_WRITE")
              ? async () => restore.mutateAsync(item?.id)
              : undefined
          }
        />
      }
    >
      <StockItemsDetailsPage readonly={true} id={id || ""} />
    </Page>
  );
};
