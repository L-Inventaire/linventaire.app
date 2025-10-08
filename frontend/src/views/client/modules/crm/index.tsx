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
import { SearchBar } from "../../../../components/search-bar";
import { schemaToSearchFields } from "../../../../components/search-bar/utils/utils";
import { CRMColumn } from "./components/crm-column";
import { TestFlexLayout } from "./test-flex-layout";

// Types et constantes
type CRMState = "new" | "qualified" | "proposal" | "won";

interface CRMStateConfig {
  key: CRMState;
  label: string;
  collapsedLogic: (isSearchMode: boolean, selectedState: string[]) => boolean;
}

const CRM_STATES_CONFIG: CRMStateConfig[] = [
  {
    key: "new",
    label: "Nouveau",
    collapsedLogic: (isSearchMode, selectedState) =>
      isSearchMode && !!selectedState.length && !selectedState.includes("new"),
  },
  {
    key: "qualified",
    label: "Qualifié",
    collapsedLogic: (isSearchMode, selectedState) =>
      isSearchMode &&
      !!selectedState.length &&
      !selectedState.includes("qualified"),
  },
  {
    key: "proposal",
    label: "Proposition",
    collapsedLogic: (isSearchMode, selectedState) =>
      isSearchMode &&
      !!selectedState.length &&
      !selectedState.includes("proposal"),
  },
  {
    key: "won",
    label: "Terminé",
    collapsedLogic: (isSearchMode, selectedState) =>
      !isSearchMode ||
      (!!selectedState.length && !selectedState.includes("won")),
  },
];

const DEFAULT_PAGE_SIZE = 50;

// Hook réutilisable pour charger les éléments CRM par état
const useCRMItemsByState = (
  state: CRMState,
  options: RestOptions<CRMItem>,
  paginationState: { [key: string]: { offset: number; hasMore: boolean } }
) => {
  return useCRMItems({
    key: `crm-${state}-items`,
    ...options,
    offset: paginationState[state].offset,
    query: [
      ...(options.query as RestSearchQuery[]),
      {
        key: "state",
        values: [{ value: state, op: "equals" }],
      } as RestSearchQuery,
    ],
  });
};

// Hook réutilisable pour charger les compteurs CRM par état
const useCRMCounterByState = (
  state: CRMState,
  baseQuery: RestSearchQuery[]
) => {
  return useCRMItems({
    key: `${state}ItemsCount`,
    limit: 1,
    query: [
      ...baseQuery,
      {
        key: "state",
        values: [{ value: state, op: "equals" }],
      } as RestSearchQuery,
    ],
  });
};

export const CRMPage = () => {
  const [options, setOptions] = useState<RestOptions<CRMItem>>({
    query: [],
    asc: false,
    index: "created_at",
    limit: DEFAULT_PAGE_SIZE,
    offset: 0,
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

  // État pour la pagination par colonne
  const [paginationState, setPaginationState] = useState<{
    [key: string]: { offset: number; hasMore: boolean };
  }>({
    new: { offset: 0, hasMore: true },
    qualified: { offset: 0, hasMore: true },
    proposal: { offset: 0, hasMore: true },
    won: { offset: 0, hasMore: true },
  });

  // Hooks pour charger les éléments par état avec pagination
  const { crm_items: newItems, update } = useCRMItemsByState(
    "new",
    options,
    paginationState
  );
  const { crm_items: qualifiedItems } = useCRMItemsByState(
    "qualified",
    options,
    paginationState
  );
  const { crm_items: proposalItems } = useCRMItemsByState(
    "proposal",
    options,
    paginationState
  );
  const { crm_items: wonItems } = useCRMItemsByState(
    "won",
    options,
    paginationState
  );

  // Compteurs pour chaque état
  const baseQuery = options.query as RestSearchQuery[];
  const { crm_items: newItemsCount } = useCRMCounterByState("new", baseQuery);
  const { crm_items: qualifiedItemsCount } = useCRMCounterByState(
    "qualified",
    baseQuery
  );
  const { crm_items: proposalItemsCount } = useCRMCounterByState(
    "proposal",
    baseQuery
  );
  const { crm_items: wonItemsCount } = useCRMCounterByState("won", baseQuery);

  const counters = {
    new: newItemsCount?.data?.total || 0,
    qualified: qualifiedItemsCount?.data?.total || 0,
    proposal: proposalItemsCount?.data?.total || 0,
    won: wonItemsCount?.data?.total || 0,
  };

  const schema = useRestSchema("crm_items");

  // Combiner les éléments avec le cache et mettre à jour hasMore
  const getItemsForState = (
    state: "new" | "qualified" | "proposal" | "won"
  ) => {
    let currentItems: CRMItem[] = [];
    let total = 0;

    switch (state) {
      case "new":
        currentItems = newItems?.data?.list || [];
        total = newItems?.data?.total || 0;
        break;
      case "qualified":
        currentItems = qualifiedItems?.data?.list || [];
        total = qualifiedItems?.data?.total || 0;
        break;
      case "proposal":
        currentItems = proposalItems?.data?.list || [];
        total = proposalItems?.data?.total || 0;
        break;
      case "won":
        currentItems = wonItems?.data?.list || [];
        total = wonItems?.data?.total || 0;
        break;
    }

    // Mettre à jour hasMore selon le nombre total d'éléments
    const currentOffset = paginationState[state].offset;
    const limit = options.limit || 10;
    const hasMore = currentOffset + limit < total;

    if (paginationState[state].hasMore !== hasMore) {
      setPaginationState((prev) => ({
        ...prev,
        [state]: { ...prev[state], hasMore },
      }));
    }

    return currentItems;
  };

  // Fonctions génériques pour la pagination
  const updatePaginationOffset = (state: CRMState, offsetChange: number) => {
    setPaginationState((prev) => ({
      ...prev,
      [state]: {
        ...prev[state],
        offset: Math.max(0, prev[state].offset + offsetChange),
      },
    }));
  };

  const loadMoreItems = (state: CRMState) => {
    const limit = options.limit || DEFAULT_PAGE_SIZE;
    updatePaginationOffset(state, limit);
  };

  const loadPreviousItems = (state: CRMState) => {
    const limit = options.limit || DEFAULT_PAGE_SIZE;
    updatePaginationOffset(state, -limit);
  };

  // Temporary: Show test layout to debug flex behavior step by step
  const showTestLayout = new URLSearchParams(window.location.search).has(
    "test"
  );

  if (showTestLayout) {
    return <TestFlexLayout />;
  }

  return (
    <Page
      inset
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
      <div className="h-full flex flex-col">
        <div className="px-3 h-7 w-full bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
          <Info>
            {counters.new +
              counters.qualified +
              counters.proposal +
              counters.won || 0}{" "}
            documents trouvés
          </Info>
        </div>

        <div className="h-full flex-1 relative">
          <div className="absolute h-full w-full flex flex-col">
            <div className="flex-1 flex overflow-hidden p-2 gap-2">
              {CRM_STATES_CONFIG.map((config) => (
                <CRMColumn
                  key={config.key}
                  type={config.key}
                  items={getItemsForState(config.key)}
                  title={config.label}
                  count={counters[config.key]}
                  collapsed={config.collapsedLogic(isSearchMode, selectedState)}
                  onMove={(item) => {
                    update.mutate({ id: item.id, state: config.key });
                  }}
                  onLoadMore={() => loadMoreItems(config.key)}
                  onLoadPrevious={() => loadPreviousItems(config.key)}
                  canLoadMore={paginationState[config.key].hasMore}
                  canLoadPrevious={paginationState[config.key].offset > 0}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
};
