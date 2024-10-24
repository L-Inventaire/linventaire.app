import { RestOptions, useRest } from "@features/utils/rest/hooks/use-rest";
import { Articles } from "../types/types";
import { useEffect } from "react";

export const useArticles = (options?: RestOptions<Articles>) => {
  const rest = useRest<Articles>("articles", options);

  useEffect(() => {
    rest.refresh();
  }, [JSON.stringify(options)]);

  return { articles: rest.items, ...rest };
};

export const useArticle = (id: string) => {
  const rest = useArticles({ id });
  return {
    article: id ? (rest.articles.data?.list || [])[0] : null,
    isPending: id ? rest.articles.isPending : false,
    ...rest,
  };
};
