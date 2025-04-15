import { Info } from "@atoms/text";
import { useCRMItems } from "@features/crm/state/use-crm";
import { CRMItem } from "@features/crm/types/types";
import {
  RestOptions,
  RestSearchQuery,
  useRestSchema,
} from "@features/utils/rest/hooks/use-rest";
import { Page } from "@views/client/_layout/page";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { SearchBar } from "../../../../components/search-bar";
import { schemaToSearchFields } from "../../../../components/search-bar/utils/utils";
import { CRMColumn } from "./components/crm-column";

export const CRMPage = () => {
  const [options, setOptions] = useState<RestOptions<CRMItem>>({
    query: [],
    asc: false,
    index: "created_at",
    limit: 500, // TODO: for now it's a hard limit, we should implement pagination
  });
  const { crm_items: crm_items_raw, update } = useCRMItems({
    ...options,
    query: [...(options.query as RestSearchQuery[])],
  });

  const schema = useRestSchema("crm");
  const crm_items = crm_items_raw?.data?.list || [];

  return (
    <Page
      title={[{ label: "CRM" }]}
      bar={
        <SearchBar
          schema={{
            table: "crm_items",
            fields: schemaToSearchFields(schema.data, {}),
          }}
          loading={schema.isPending}
          onChange={(q) =>
            q.valid && setOptions({ ...options, query: q.fields })
          }
        />
      }
    >
      <div className="-m-3 overflow-auto max-w-[100vw] h-full flex flex-col">
        <div className="px-3 h-7 w-full bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
          <Info>{crm_items_raw?.data?.total || 0} documents trouvés</Info>
        </div>

        <div
          className={twMerge(
            "grid grid-cols-4 w-full flex-1 grow rounded-none space-x-2 p-2"
          )}
        >
          <CRMColumn
            type="new"
            items={crm_items.filter((item) => item.state === "new")}
            title="Nouveau"
            onMove={(item) => {
              update.mutate({ id: item.id, state: "new" });
            }}
          />
          <CRMColumn
            type="qualified"
            items={crm_items.filter((item) => item.state === "qualified")}
            title="Qualifié"
            onMove={(item) => {
              update.mutate({ id: item.id, state: "qualified" });
            }}
          />
          <CRMColumn
            type="proposal"
            items={crm_items.filter((item) => item.state === "proposal")}
            title="Proposition"
            onMove={(item) => {
              update.mutate({ id: item.id, state: "proposal" });
            }}
          />
          <CRMColumn
            type="won"
            items={crm_items.filter((item) => item.state === "won")}
            title="Terminé"
            onMove={(item) => {
              update.mutate({ id: item.id, state: "won" });
            }}
          />
        </div>
      </div>
    </Page>
  );
};
