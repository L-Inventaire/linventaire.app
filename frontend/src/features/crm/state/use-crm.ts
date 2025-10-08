import { RestOptions, useRest } from "@features/utils/rest/hooks/use-rest";
import { useDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { useEffect } from "react";
import { CRMItem } from "../types/types";

export const useCRMItems = (options?: RestOptions<CRMItem>) => {
  const rest = useRest<CRMItem>("crm_items", options);

  useEffect(() => {
    rest.refresh();
  }, [JSON.stringify(options)]);

  return { crm_items: rest.items, ...rest };
};

export const useCRMItem = (
  id: string,
  initial?: Partial<CRMItem>,
  cb?: (item: CRMItem) => Promise<void>
) => {
  const rest = useDraftRest<CRMItem>(
    "crm_items",
    id,
    cb || (() => new Promise((resolve) => resolve())),
    initial
  );
  return {
    crm_item: rest.draft,
    ...rest,
  };
};
