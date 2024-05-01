import { useRest } from "@features/utils/rest/hooks/use-rest";
import { Fields } from "../types/types";

export const useFields = () => {
  const rest = useRest<Fields>("fields");
  return { fields: rest.items, ...rest };
};
