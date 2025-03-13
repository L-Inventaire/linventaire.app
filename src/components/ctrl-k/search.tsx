import { Button } from "@atoms/button/button";
import { Base } from "@atoms/text";
import { SearchBar } from "@components/search-bar";
import { Suggestions } from "@components/search-bar/hooks/use-suggestions";
import {
  buildQueryFromMap,
  schemaToSearchFields,
} from "@components/search-bar/utils/utils";
import {
  CtrlkAction,
  CtrlKRestEntities,
  RootNavigationItems,
} from "@features/ctrlk";
import { CtrlKAtom } from "@features/ctrlk/store";
import { getRoute } from "@features/routes";
import { useNavigateAlt } from "@features/utils/navigate";
import {
  RestSearchQuery,
  useRest,
  useRestSchema,
} from "@features/utils/rest/hooks/use-rest";
import { RestEntity } from "@features/utils/rest/types/types";
import {
  LockClosedIcon,
  LockOpenIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid";
import {
  ArrowRightIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { Table } from "@molecules/table";
import { useQueryClient } from "@tanstack/react-query";
import _ from "lodash";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRecoilState } from "recoil";
import { twMerge } from "tailwind-merge";
import { filterSuggestions, useSearchableEntities } from "./search-utils";

export const SearchCtrlK = ({ index }: { index: number }) => {
  const [states, setStates] = useRecoilState(CtrlKAtom);
  const [actionLoading, setActionLoading] = useState(false);

  const queryClient = useQueryClient();

  const state = states[index];
  const setState = (newState: any) => {
    setStates((states) => {
      const newStates = [...states];
      newStates[index] = newState;
      return newStates;
    });
  };

  const { t } = useTranslation();
  const currentState = state.path[state.path.length - 1] || {};
  const currentEntity = currentState.options?.entity;
  const [selection, setSelection] = useState<RestEntity[]>(
    currentState.options?.selected || []
  );
  const [initialSelection, setInitialSelection] = useState<RestEntity[]>(
    currentState.options?.selected || []
  );

  useEffect(() => {
    setInitialSelection(_.intersectionBy(initialSelection, selection, "id"));
  }, [selection.length]);

  const toggleSelection = (item: RestEntity) => {
    setSelection((prev) =>
      prev.find((a) => a.id === item.id)
        ? prev.filter((a) => a.id !== item.id)
        : [...prev, item]
    );
  };

  const navigateAlt = useNavigateAlt();
  const close = () => {
    setState({
      path: [],
      selection: state.selection,
    });
  };

  const searchableEntities = useSearchableEntities(index);
  const query = currentState.options?.query || "";
  const [searchQuery, setSearchQuery] = useState<RestSearchQuery[]>([]);
  const setQuery = (query: string) => {
    setState(
      _.set(_.cloneDeep(state), "path", [
        ...state.path.map((a, i) =>
          i === state.path.length - 1
            ? _.set(_.cloneDeep(a), "options.query", query)
            : a
        ),
      ])
    );
  };
  const typedQueryStr =
    searchQuery.find((a) => a.key === "query")?.values?.[0]?.value || "";

  const [useInternalQuery, setUseInternalQuery] = useState(true);

  const schema = useRestSchema(currentEntity || "");
  const { items } = useRest<RestEntity & any>(currentEntity || "", {
    limit: 50,
    index: CtrlKRestEntities[currentEntity || ""]?.orderBy,
    asc: !CtrlKRestEntities[currentEntity || ""]?.orderDesc,
    query: [
      ...searchQuery,
      ...(useInternalQuery
        ? buildQueryFromMap(currentState.options?.internalQuery || {})
        : []),
    ],
    key: "crtl-k-" + currentEntity + "-" + state.path.length,
    queryFn: CtrlKRestEntities[currentEntity || ""]?.resultList
      ? async () =>
          (await CtrlKRestEntities[currentEntity || ""]?.resultList?.(
            typedQueryStr
          )) || {
            total: 0,
            list: [],
          }
      : undefined,
  });

  return (
    <>
      <SearchBar
        key={"crtl-k-" + currentEntity + "-" + state.path.length}
        inlineSuggestions
        autoFocus
        urlSync={false}
        inputClassName="py-2"
        schema={
          currentState.mode === "search"
            ? {
                table: currentEntity || "",
                fields: schemaToSearchFields(schema.data),
              }
            : { table: "ctrl+k", fields: [] }
        }
        value={query}
        onChange={(obj, q) => {
          if (currentState.mode === "action") setQuery(q); // Make sure the default query is set
          if (obj.valid) setSearchQuery(obj.fields);
        }}
        showExport={false}
        placeholder={t("ctrlk.search.placeholder")}
        suffix={
          <>
            {!!currentState.options?.internalQuery && (
              <Button
                onClick={() => setUseInternalQuery(!useInternalQuery)}
                theme={"invisible"}
                size="xs"
                className={useInternalQuery ? "text-blue-500" : ""}
                data-tooltip={
                  useInternalQuery
                    ? "Ignorer le filtre contextuel"
                    : "Utiliser le filtre contextuel"
                }
                icon={(p) =>
                  useInternalQuery ? (
                    <LockClosedIcon {...p} />
                  ) : (
                    <LockOpenIcon {...p} />
                  )
                }
              />
            )}
            <Button
              onClick={() => close()}
              theme="invisible"
              data-tooltip="Fermer"
              icon={(p) => <XMarkIcon {...p} />}
              shortcut={["esc"]}
            />
          </>
        }
        shortcuts={["cmd+k"]}
        debounce={1}
        operationsItems={state.selection?.items?.length}
        loading={actionLoading}
        suggestions={
          currentState.mode === "action"
            ? [
                ...(!!state.selection?.items?.length
                  ? filterSuggestions(
                      query,
                      CtrlKRestEntities[state.selection.entity || ""]
                        ?.actions?.(state.selection?.items, queryClient)
                        ?.map((a) => ({
                          ...a,
                          icon: a.icon
                            ? () =>
                                a.icon?.({
                                  className: "h-4 w-4 mx-1 opacity-50",
                                })
                            : undefined,
                        })) || []
                    ).map(
                      (a) =>
                        ({
                          type: "operator",
                          render: (
                            <div
                              className={twMerge(
                                "flex items-center",
                                "-ml-1",
                                a.className
                              )}
                            >
                              {a.icon &&
                                a.icon({
                                  className: "h-4 w-4 mx-1 opacity-50",
                                })}
                              {a.label}
                            </div>
                          ),
                          onClick: a.action
                            ? async () => {
                                setActionLoading(true);
                                try {
                                  await (a.action as CtrlkAction["action"])?.();
                                } finally {
                                  setActionLoading(false);
                                  close();
                                }
                              }
                            : undefined,
                        } as Suggestions[0])
                    )
                  : []),
                ...filterSuggestions(query, [
                  ...searchableEntities.map((a) => ({
                    ...a,
                    label: t("ctrlk.navigation.search_in") + ` '${a.label}'`,
                    icon: (p: any) => <MagnifyingGlassIcon {...p} />,
                  })),
                  ...RootNavigationItems.map((a) => ({
                    ...a,
                    label: t("ctrlk.navigation.go_to") + ` '${a.label}'`,
                    icon: (p: any) => <ArrowRightIcon {...p} />,
                    action: (event: MouseEvent) => {
                      close();
                      setTimeout(() => {
                        navigateAlt(getRoute(a.to!), { event });
                      }, 100);
                    },
                    priority: -10,
                  })),
                ]).map(
                  (a) =>
                    ({
                      type: "navigation",
                      render: (
                        <div
                          className={twMerge(
                            "flex items-center",
                            a.icon ? "-ml-1" : ""
                          )}
                        >
                          {a.icon &&
                            a.icon({ className: "h-4 w-4 mx-1 opacity-50" })}
                          {a.label}
                        </div>
                      ),
                      onClick: a.action,
                    } as Suggestions[0])
                ),
              ]
            : currentState.mode === "search"
            ? [
                // If id is used we don't want to create a new item
                query.indexOf("id:") < 0 &&
                (CtrlKRestEntities[currentEntity || ""]?.onCreate?.(
                  typedQueryStr
                )?.label ||
                  CtrlKRestEntities[currentEntity || ""]?.renderEditor)
                  ? ({
                      type: CtrlKRestEntities[currentEntity || ""]?.onCreate?.(
                        typedQueryStr
                      )?.label
                        ? "navigation"
                        : "operator",
                      value: "editor",
                      render: CtrlKRestEntities[currentEntity || ""]
                        ?.onCreate ? (
                        CtrlKRestEntities[currentEntity || ""]?.onCreate?.(
                          typedQueryStr
                        ).label
                      ) : (
                        <div className={twMerge("flex items-center -ml-3")}>
                          <PlusIcon className="h-4 w-4 mx-1 opacity-50" />
                          {typedQueryStr
                            ? `Créer '${typedQueryStr}'`
                            : "Créer un nouvel élément"}
                        </div>
                      ),
                      onClick: async () => {
                        if (CtrlKRestEntities[currentEntity || ""]?.onCreate) {
                          const res = await CtrlKRestEntities[
                            currentEntity || ""
                          ]
                            ?.onCreate?.(query)
                            .callback(query);
                          if (typeof res === "string") {
                            setQuery(res);
                          } else {
                            close();
                          }
                        } else {
                          setState({
                            ...state,
                            path: [
                              ...state.path,
                              {
                                mode: "editor",
                                options: {
                                  entity: currentEntity || "",
                                },
                              },
                            ],
                          });
                        }
                      },
                    } as Suggestions[0])
                  : ({} as Suggestions[0]),
              ]
            : []
        }
        afterSuggestions={
          <>
            {currentState.mode === "search" && (
              <div className="my-2 rounded overflow-hidden">
                <Table
                  groupBy={CtrlKRestEntities[currentEntity || ""]?.groupBy}
                  groupByRender={
                    CtrlKRestEntities[currentEntity || ""]?.groupByRender as any
                  }
                  onClick={(a, event) => {
                    if (
                      (event.shiftKey && currentState.select) ||
                      selection?.length
                    ) {
                      // Toggle selection
                      toggleSelection(a);
                      return;
                    }
                    close();
                    setTimeout(() => {
                      if (currentState.options?.onClick) {
                        currentState.options.onClick(
                          selection.length
                            ? _.uniqBy([...selection, a], "id")
                            : [a],
                          event
                        );
                        return;
                      }
                      navigateAlt(
                        getRoute(
                          CtrlKRestEntities[currentEntity || ""]?.viewRoute ||
                            "/:client/" + currentEntity + "/:id",
                          { id: a.id }
                        ),
                        { event }
                      );
                    }, 100);
                  }}
                  checkboxAlwaysVisible
                  loading={items.isPending}
                  data={[
                    ...(initialSelection || []),
                    ...((items.data?.list || [])?.filter(
                      (a) => initialSelection.map((b) => b.id).indexOf(a.id) < 0
                    ) || []),
                  ]}
                  showPagination={false}
                  onSelect={
                    currentState.select
                      ? (items) => setSelection(items)
                      : undefined
                  }
                  selection={selection}
                  rowIndex="id"
                  columns={
                    (CtrlKRestEntities[currentEntity || ""]
                      ?.renderResult as any) || [
                      {
                        render: (a: RestEntity & { _label: string }) =>
                          a._label,
                      },
                    ]
                  }
                />
              </div>
            )}
          </>
        }
      />

      {(!!selection.length || !!currentState?.options?.selected?.length) && (
        <div className="border-t border-slate-100 dark:border-slate-700 px-3 py-2 flex items-center space-x-2">
          <Base className="block grow">
            {selection.length} éléments sélectionnés
          </Base>
          {!!selection.length && (
            <Button
              size="md"
              theme="outlined"
              onClick={() => {
                setSelection([]);
              }}
            >
              Tout retirer
            </Button>
          )}
          <Button
            size="md"
            onClick={(event: any) => {
              close();
              if (currentState.options?.onClick) {
                currentState.options.onClick(selection, event as MouseEvent);
                return;
              }
            }}
          >
            Enregistrer
          </Button>
        </div>
      )}
    </>
  );
};
