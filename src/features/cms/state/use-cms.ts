import { RestOptions, useRest } from "@features/utils/rest/hooks/use-rest";
import { useEffect } from "react";
import { CMSItem } from "../types/types";

export const useCMSItems = (options?: RestOptions<CMSItem>) => {
  const rest = useRest<CMSItem>("cms", options);

  useEffect(() => {
    rest.refresh();
  }, [JSON.stringify(options)]);

  return { cms_items: rest.items, ...rest };
};

export const useArticle = (id: string) => {
  const rest = useCMSItems({ id });
  return {
    cms_item: id
      ? (rest.cms_items.data?.list || []).find((item) => item.id === id)
      : null,
    isPending: id ? rest.cms_items.isPending : false,
    ...rest,
  };
};
