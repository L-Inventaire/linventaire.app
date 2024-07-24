import { RestOptions, useRest } from "@features/utils/rest/hooks/use-rest";
import { Files } from "../types/types";
import { useEffect } from "react";

export const useFiles = (options?: RestOptions<Files>) => {
  const rest = useRest<Files>("files", options);

  useEffect(() => {
    rest.refresh();
  }, [JSON.stringify(options)]);

  return { files: rest.items, ...rest };
};

export const useFile = (id: string) => {
  const rest = useFiles({ query: { id }, limit: id ? 1 : 0 });
  return {
    file: id ? (rest.files.data?.list || [])[0] : null,
    isPending: id ? rest.files.isPending : false,
    ...rest,
  };
};
