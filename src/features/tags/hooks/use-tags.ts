import { RestOptions, useRest } from "@features/utils/rest/hooks/use-rest";
import { Tags } from "../types/types";

export const useTags = (options?: RestOptions<Tags> | undefined) => {
  const rest = useRest<Tags>("tags", options);
  return { tags: rest.items, ...rest };
};
