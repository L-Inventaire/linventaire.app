import { RestOptions, useRest } from "@features/utils/rest/hooks/use-rest";
import { StockLocations } from "../types/types";
import { useEffect } from "react";

export const useStockLocations = (options?: RestOptions<StockLocations>) => {
  const rest = useRest<StockLocations>("stock_locations", options);

  useEffect(() => {
    rest.refresh();
  }, [JSON.stringify(options)]);

  return { stock_locations: rest.items, ...rest };
};

export const useStockLocation = (id: string) => {
  const rest = useStockLocations({ query: { id } });
  return {
    stock_location: id ? (rest.stock_locations.data?.list || [])[0] : null,
    isPending: id ? rest.stock_locations.isPending : false,
    ...rest,
  };
};
