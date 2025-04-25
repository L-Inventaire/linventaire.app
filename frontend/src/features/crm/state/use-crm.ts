import { RestOptions, useRest } from "@features/utils/rest/hooks/use-rest";
import { useEffect } from "react";
import { CRMItem } from "../types/types";

export const useCRMItems = (options?: RestOptions<CRMItem>) => {
  const rest = useRest<CRMItem>("crm_items", options);

  useEffect(() => {
    rest.refresh();
  }, [JSON.stringify(options)]);

  return { crm_items: rest.items, ...rest };
};

export const useArticle = (id: string) => {
  const rest = useCRMItems({ id });
  return {
    crm_item: id
      ? (rest.crm_items.data?.list || []).find((item) => item.id === id)
      : null,
    isPending: id ? rest.crm_items.isPending : false,
    ...rest,
  };
};
