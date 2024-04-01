import { useRest } from "@features/utils/rest/hooks/use-rest";
import { Comments } from "../types/types";

export const useComments = (target: string) => {
  const rest = useRest<Comments>("comments");
  return { comments: rest.items, ...rest };
};
