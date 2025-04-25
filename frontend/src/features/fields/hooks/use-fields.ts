import { useRest } from "@features/utils/rest/hooks/use-rest";
import { Fields } from "../types/types";

export const useFields = () => {
  const rest = useRest<Fields>("fields");
  return { fields: rest.items, ...rest };
};

export const useTableFields = (type: string) => {
  const { fields } = useFields();
  return {
    loading: fields.isPending,
    fields: (fields.data?.list || []).filter((f) => f.document_type === type),
  };
};
