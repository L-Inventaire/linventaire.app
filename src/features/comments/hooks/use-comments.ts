import { RestOptions, useRest } from "@features/utils/rest/hooks/use-rest";
import { Comments } from "../types/types";
import { useEffect } from "react";

export const useComments = (options?: RestOptions<Comments>) => {
  const rest = useRest<Comments>("comments", options);

  useEffect(() => {
    rest.refresh();
  }, [JSON.stringify(options)]);

  return { comments: rest.items, ...rest };
};

export const useComment = (id: string) => {
  const rest = useComments({ id, limit: id ? 1 : 0 });

  return {
    comment: id ? (rest.comments.data?.list || [])[0] : null,
    isPending: id ? rest.comments.isPending : false,
    ...rest,
  };
};
