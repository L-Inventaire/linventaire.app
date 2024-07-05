import { Button } from "@atoms/button/button";
import { SearchBar } from "@components/search-bar";
import { Suggestions } from "@components/search-bar/hooks/use-suggestions";
import {
  buildQueryFromMap,
  schemaToSearchFields,
} from "@components/search-bar/utils/utils";
import { CtrlKRestEntities, RootNavigationItems } from "@features/ctrlk";
import { CtrlKAtom } from "@features/ctrlk/store";
import { getRoute } from "@features/routes";
import { useNavigateAlt } from "@features/utils/navigate";
import {
  RestSearchQuery,
  useRest,
  useRestSchema,
} from "@features/utils/rest/hooks/use-rest";
import { RestEntity } from "@features/utils/rest/types/types";
import { XMarkIcon } from "@heroicons/react/16/solid";
import {
  ArrowRightIcon,
  DocumentDuplicateIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import _ from "lodash";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRecoilState } from "recoil";
import { twMerge } from "tailwind-merge";
import { filterSuggestions, useSearchableEntities } from "./search-utils";
import { Checkbox } from "@atoms/input/input-checkbox";
import { Base, Info } from "@atoms/text";

export const SearchCtrlK = () => {
  const { t } = useTranslation();
  const [state, setState] = useRecoilState(CtrlKAtom);
  const [selection, setSelection] = useState<RestEntity[]>([]);
  const currentState = state.path[state.path.length - 1] || {};
  const currentEntity = currentState.options?.entity;

  const toggleSelection = (item: RestEntity) => {
    setSelection((prev) =>
      prev.find((a) => a.id === item.id)
        ? prev.filter((a) => a.id !== item.id)
        : [...prev, item]
    );
  };

  const navigateAlt = useNavigateAlt();
  const close = () =>
    setState({
      path: [],
      selection: { entity: "", items: [] },
    });

  const searchableEntities = useSearchableEntities();
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

  const schema = useRestSchema(currentEntity || "");
  const { items } = useRest<RestEntity & any>(currentEntity || "", {
    limit: 50,
    query: [
      ...searchQuery,
      ...buildQueryFromMap(currentState.options?.internalQuery || {}),
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

  const list = items.data?.list || [];

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
          <Button
            onClick={() => close()}
            theme="invisible"
            data-tooltip="Close"
            icon={(p) => <XMarkIcon {...p} />}
            shortcut={["esc"]}
          />
        }
        shortcuts={["cmd+k"]}
        debounce={1}
        suggestions={
          currentState.mode === "action"
            ? [
                ...(!!state.selection?.items?.length
                  ? filterSuggestions(query, [
                      {
                        label: "Modifier 'Étiquettes'...",
                        keywords: ["tags", "étiquettes", "catégories"],
                        icon: (p: any) => <PencilIcon {...p} />,
                      },
                      {
                        label: "Dupliquer la sélection",
                        keywords: ["duplicate", "copy", "cloner"],
                        icon: (p: any) => <DocumentDuplicateIcon {...p} />,
                      },
                      {
                        label: "Supprimer la sélection",
                        keywords: ["delete", "remove", "retirer"],
                        className: "text-red-500",
                        icon: (p: any) => <TrashIcon {...p} />,
                      },
                    ]).map(
                      (a) =>
                        ({
                          type: "operator",
                          render: (
                            <div
                              className={twMerge(
                                "flex items-center",
                                a.icon ? "-ml-3" : "-ml-1",
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
                          onClick: a.action,
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
                ...(list || []).map(
                  (a: RestEntity & { _label: string }) =>
                    ({
                      type: "navigation",
                      value: a._label,
                      render: (
                        <div className="flex items-center space-x-2">
                          {currentState.select && (
                            <div onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                size="sm"
                                value={!!selection.find((b) => a.id === b.id)}
                                onChange={() => toggleSelection(a)}
                              />
                            </div>
                          )}
                          {CtrlKRestEntities[
                            currentEntity || ""
                          ]?.renderResult?.(a) || a._label}
                        </div>
                      ),
                      onClick: (event) => {
                        if (event.shiftKey && currentState.select) {
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
                              CtrlKRestEntities[currentEntity || ""]
                                ?.viewRoute ||
                                "/:client/" + currentEntity + "/:id",
                              { id: a.id }
                            ),
                            { event }
                          );
                        }, 100);
                      },
                    } as Suggestions[0])
                ),
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
                      value: "create",
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
                                mode: "create",
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
      />

      {!!selection.length && (
        <div className="border-t border-slate-100 dark:border-slate-700 px-3 py-2 flex items-center">
          <Base className="block grow">
            {selection.length} éléments sélectionnés
          </Base>
          <Button
            size="sm"
            onClick={(event: any) => {
              close();
              if (currentState.options?.onClick) {
                currentState.options.onClick(selection, event as MouseEvent);
                return;
              }
            }}
          >
            Sélectionner
          </Button>
        </div>
      )}
    </>
  );
};
