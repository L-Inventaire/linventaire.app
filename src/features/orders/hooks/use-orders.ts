import { RestOptions, useRest } from "@features/utils/rest/hooks/use-rest";
import { Orders } from "../types/types";
import { useEffect } from "react";

export const useOrders = (options?: RestOptions<Orders>) => {
  const rest = useRest<Orders>("orders", options);

  useEffect(() => {
    rest.refresh();
  }, [JSON.stringify(options)]);

  return { orders: rest.items, ...rest };
};

export const useOrder = (id: string) => {
  const rest = useOrders({ query: { id } });
  return {
    order: id ? (rest.orders.data?.list || [])[0] : null,
    isPending: id ? rest.orders.isPending : false,
    ...rest,
  };
};
