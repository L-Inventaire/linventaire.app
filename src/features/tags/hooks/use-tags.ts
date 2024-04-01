import { useRest } from "@features/utils/rest/hooks/use-rest";
import { Tags } from "../types/types";

export const useTags = () => {
  const rest = useRest<Tags>("tags");
  return { tags: rest.items, ...rest };
};
