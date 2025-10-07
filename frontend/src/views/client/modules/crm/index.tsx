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
    limit: 5, // TODO: for now it's a hard limit, we should implement pagination
  });

  // Détecter si nous sommes en mode recherche (si des filtres sont appliqués)
  const isSearchMode =
    Array.isArray(options.query) &&
    options.query.filter((a) => a.values?.[0]?.value?.trim()).length > 0;

  // Détecter si un état spécifique est filtré
  const getStateFilter = (): string[] => {
    if (!Array.isArray(options.query)) return [];
    return options.query
      .filter((a) => a.key === "state")
      .flatMap((a) => a.values)
      .map((a) => a?.value);
  };

  const selectedState = getStateFilter();

  const { crm_items: crm_items_raw, update } = useCRMItems({
    ...options,
    query: [
      ...(options.query as RestSearchQuery[]),
      ...(!isSearchMode
        ? [
            {
              key: "state",
              not: true,
              values: [{ value: "won", op: "equals" }],
            } as RestSearchQuery,
          ]
        : []),
    ],
  });

  // Compteurs pour chaque état
  const baseQuery = options.query as RestSearchQuery[];
  const { crm_items: newItemsCount } = useCRMItems({
    key: "newItemsCount",
    limit: 1,
    query: [
      ...baseQuery,
      {
        key: "state",
        values: [{ value: "new", op: "equals" }],
      } as RestSearchQuery,
    ],
  });

  const { crm_items: qualifiedItemsCount } = useCRMItems({
    key: "qualifiedItemsCount",
    limit: 1,
    query: [
      ...baseQuery,
      {
        key: "state",
        values: [{ value: "qualified", op: "equals" }],
      } as RestSearchQuery,
    ],
  });

  const { crm_items: proposalItemsCount } = useCRMItems({
    key: "proposalItemsCount",
    limit: 1,
    query: [
      ...baseQuery,
      {
        key: "state",
        values: [{ value: "proposal", op: "equals" }],
      } as RestSearchQuery,
    ],
  });

  const { crm_items: wonItemsCount } = useCRMItems({
    key: "wonItemsCount",
    limit: 1,
    query: [
      ...baseQuery,
      {
        key: "state",
        values: [{ value: "won", op: "equals" }],
      } as RestSearchQuery,
    ],
  });

  const counters = {
    new: newItemsCount?.data?.total || 0,
    qualified: qualifiedItemsCount?.data?.total || 0,
    proposal: proposalItemsCount?.data?.total || 0,
    won: wonItemsCount?.data?.total || 0,
  };

  const schema = useRestSchema("crm_items");
  const crm_items = crm_items_raw?.data?.list || [];

  console.log(options.query);

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

        <div className="flex-1 grow overflow-x-auto">
          <div
            className={twMerge("flex w-full h-full rounded-none space-x-2 p-2")}
          >
            <CRMColumn
              type="new"
              items={crm_items.filter((item) => item.state === "new")}
              title="Nouveau"
              count={counters.new}
              collapsed={
                isSearchMode &&
                !!selectedState.length &&
                !selectedState.includes("new")
              }
              onMove={(item) => {
                update.mutate({ id: item.id, state: "new" });
              }}
            />
            <CRMColumn
              type="qualified"
              items={crm_items.filter((item) => item.state === "qualified")}
              title="Qualifié"
              count={counters.qualified}
              collapsed={
                isSearchMode &&
                !!selectedState.length &&
                !selectedState.includes("qualified")
              }
              onMove={(item) => {
                update.mutate({ id: item.id, state: "qualified" });
              }}
            />
            <CRMColumn
              type="proposal"
              items={crm_items.filter((item) => item.state === "proposal")}
              title="Proposition"
              count={counters.proposal}
              collapsed={
                isSearchMode &&
                !!selectedState.length &&
                !selectedState.includes("proposal")
              }
              onMove={(item) => {
                update.mutate({ id: item.id, state: "proposal" });
              }}
            />
            <CRMColumn
              type="won"
              items={crm_items.filter((item) => item.state === "won")}
              title="Terminé"
              count={counters.won}
              collapsed={
                !isSearchMode ||
                (!!selectedState.length && !selectedState.includes("qualified"))
              }
              onMove={(item) => {
                update.mutate({ id: item.id, state: "won" });
              }}
            />
          </div>
        </div>
      </div>
    </Page>
  );
};
