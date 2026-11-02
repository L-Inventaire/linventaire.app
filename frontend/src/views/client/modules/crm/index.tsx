import { Info } from "@atoms/text";
import {
  CRM_BOARD_STATES,
  CRMState,
  useCRMBoardMove,
} from "@features/crm/state/use-crm-board";
import { CRMItem } from "@features/crm/types/types";
import {
  RestSearchQuery,
  useRestCount,
  useRestSchema,
} from "@features/utils/rest/hooks/use-rest";
import { Page } from "@views/client/_layout/page";
import _ from "lodash";
import { useState } from "react";
import { useMediaQuery } from "usehooks-ts";
import { SearchBar } from "../../../../components/search-bar";
import { schemaToSearchFields } from "../../../../components/search-bar/utils/utils";
import { CRMColumn } from "./components/crm-column";
import { CRMMobileBoard } from "./components/crm-mobile-board";

const useCRMCount = (state: CRMState, query: RestSearchQuery[]) =>
  useRestCount("crm_items", {
    key: `crm-count-${state}`,
    query: [
      ...query.filter((q) => q.key !== "state"),
      { key: "state", values: [{ value: state, op: "equals" }] },
    ],
  }).data;

export const CRMPage = () => {
  const [query, setQuery] = useState<RestSearchQuery[]>([]);
  // Columns opened or closed by the user, overriding the default
  const [toggled, setToggled] = useState<Partial<Record<CRMState, boolean>>>(
    {},
  );
  const move = useCRMBoardMove();
  const onMove = (item: CRMItem, state: CRMState) =>
    move.mutate({ item, state });
  // Phones get one step at a time instead of the columns side by side
  const isMobile = useMediaQuery("(max-width: 767px)");
  const schema = useRestSchema("crm_items");

  const isSearchMode = query.some((a) => a.values?.[0]?.value?.trim?.());
  const selectedStates = query
    .filter((a) => a.key === "state")
    .flatMap((a) => a.values.map((v) => v?.value));

  // Without search, finished items are hidden; with a state filter, only the
  // selected columns are opened
  const isCollapsedByDefault = (state: CRMState) =>
    (state === "won" && !isSearchMode) ||
    (!!selectedStates.length && !selectedStates.includes(state));

  const counters: Record<string, number | undefined> = {
    new: useCRMCount("new", query),
    qualified: useCRMCount("qualified", query),
    proposal: useCRMCount("proposal", query),
    won: useCRMCount("won", query),
  };
  const total = CRM_BOARD_STATES.reduce(
    (acc, s) => acc + (counters[s.key] || 0),
    0,
  );

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
          onChange={(q) => {
            if (!q.valid) return;
            // The search bar emits an empty full text filter on load: ignore
            // it so that the board is not loaded twice
            const fields = (q.fields as RestSearchQuery[]).filter((f) =>
              f.values.some((v) => `${v?.value ?? ""}`.trim() !== ""),
            );
            if (_.isEqual(fields, query)) return;
            setQuery(fields);
            setToggled({});
          }}
        />
      }
    >
      <div className="h-full flex flex-col">
        <div className="hidden md:block px-3 h-7 w-full bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
          <Info>{total} documents trouvés</Info>
        </div>

        {isMobile ? (
          <div className="flex-1 relative">
            <div className="absolute inset-0">
              <CRMMobileBoard
                query={query}
                counters={counters}
                onMove={onMove}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 relative">
            <div className="absolute inset-0 overflow-x-auto flex p-2 gap-2">
              {CRM_BOARD_STATES.map(({ key, label }) => {
                const collapsedByDefault = isCollapsedByDefault(key);
                const collapsed =
                  key in toggled ? !!toggled[key] : collapsedByDefault;
                return (
                  <CRMColumn
                    key={key}
                    type={key}
                    title={label}
                    query={query}
                    count={counters[key]}
                    collapsed={collapsed}
                    onToggleCollapsed={
                      collapsedByDefault || key in toggled
                        ? () => setToggled((t) => ({ ...t, [key]: !collapsed }))
                        : undefined
                    }
                    onMove={onMove}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Page>
  );
};
