import { RestOptions, useRest } from "@features/utils/rest/hooks/use-rest";
import { ServiceItems } from "../types/types";
import { useEffect } from "react";

export const useServiceItems = (options?: RestOptions<ServiceItems>) => {
  const rest = useRest<ServiceItems>("service_items", options);

  useEffect(() => {
    rest.refresh();
  }, [JSON.stringify(options)]);

  return { service_items: rest.items, ...rest };
};

export const useServiceItem = (id: string) => {
  const rest = useServiceItems({ query: { id } });
  return {
    service_item: id ? (rest.service_items.data?.list || [])[0] : null,
    isPending: id ? rest.service_items.isPending : false,
    ...rest,
  };
};
