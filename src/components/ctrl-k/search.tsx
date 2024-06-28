import { Button } from "@atoms/button/button";
import { SearchBar } from "@components/search-bar";
import { Suggestions } from "@components/search-bar/hooks/use-suggestions";
import {
  buildQueryFromMap,
  schemaToSearchFields,
} from "@components/search-bar/utils/utils";
import { getRoute } from "@features/routes";
import { useNavigateAlt } from "@features/utils/navigate";
import {
  RestSearchQuery,
  useRest,
  useRestSchema,
} from "@features/utils/rest/hooks/use-rest";
import { RestEntity } from "@features/utils/rest/types/types";
import { XMarkIcon } from "@heroicons/react/16/solid";
import _ from "lodash";
import { useState } from "react";
import { useRecoilState } from "recoil";
import { CtrlKAtom } from "@features/ctrlk/store";
import { filterSuggestions, useSearchableEntities } from "./search-utils";
import { CtrlKRestEntities, RootNavigationItems } from "@features/ctrlk";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";
import {
  ArrowRightIcon,
  DocumentDuplicateIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

export const SearchCtrlK = () => {
  const { t } = useTranslation();
  const [state, setState] = useRecoilState(CtrlKAtom);
  const currentState = state.path[state.path.length - 1] || {};

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

  const schema = useRestSchema(currentState.options?.entity || "");
  const { items } = useRest<RestEntity & any>(
    currentState.options?.entity || "",
    {
      limit: 50,
      query: [
        ...searchQuery,
        ...buildQueryFromMap(currentState.options?.internalQuery || {}),
      ],
      key: "crtl-k-" + currentState.options?.entity + "-" + state.path.length,
    }
  );

  return (
    <SearchBar
      key={"crtl-k-" + currentState.options?.entity + "-" + state.path.length}
      inlineSuggestions
      autoFocus
      urlSync={false}
      inputClassName="py-2"
      schema={
        currentState.mode === "search"
          ? {
              table: currentState.options?.entity || "",
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
                              a.icon({ className: "h-4 w-4 mx-1 opacity-50" })}
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
                          a.icon ? "-ml-3" : "-ml-1"
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
              query.indexOf("id:") < 0
                ? ({
                    type: "operator",
                    value: "create",
                    render: (
                      <div className={twMerge("flex items-center -ml-3")}>
                        <PlusIcon className="h-4 w-4 mx-1 opacity-50" />
                        {query ? `Créer '${query}'` : "Créer un nouvel élément"}
                      </div>
                    ),
                    onClick: () => {
                      setState({
                        ...state,
                        path: [
                          ...state.path,
                          {
                            mode: "create",
                            options: {
                              entity: currentState.options?.entity || "",
                            },
                          },
                        ],
                      });
                    },
                  } as Suggestions[0])
                : ({} as Suggestions[0]),
              ...(items.data?.list || []).map(
                (a) =>
                  ({
                    type: "navigation",
                    value: a._label,
                    render:
                      CtrlKRestEntities[
                        currentState.options?.entity || ""
                      ]?.renderResult?.(a),
                    onClick: (event) => {
                      close();
                      setTimeout(() => {
                        if (currentState.options?.onClick) {
                          currentState.options.onClick(a, event);
                          return;
                        }
                        navigateAlt(
                          getRoute(
                            CtrlKRestEntities[
                              currentState.options?.entity || ""
                            ]?.viewRoute ||
                              "/:client/" +
                                currentState.options?.entity +
                                "/:id",
                            { id: a.id }
                          ),
                          { event }
                        );
                      }, 100);
                    },
                  } as Suggestions[0])
              ),
            ]
          : []
      }
    />
  );
};
