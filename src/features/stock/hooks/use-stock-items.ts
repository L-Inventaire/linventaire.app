import { RestOptions, useRest } from "@features/utils/rest/hooks/use-rest";
import { StockItems } from "../types/types";
import { useEffect } from "react";

export const useStockItems = (options?: RestOptions<StockItems>) => {
  const rest = useRest<StockItems>("stock_items", options);

  useEffect(() => {
    rest.refresh();
  }, [JSON.stringify(options)]);

  return { stock_items: rest.items, ...rest };
};

export const useStockItem = (id: string) => {
  const rest = useStockItems({ id });
  return {
    stock_item: id ? (rest.stock_items.data?.list || [])[0] : null,
    isPending: id ? rest.stock_items.isPending : false,
    ...rest,
  };
};
