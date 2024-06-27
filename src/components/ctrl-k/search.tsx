import { Button } from "@atoms/button/button";
import { SearchBar } from "@components/search-bar";
import { Suggestions } from "@components/search-bar/hooks/use-suggestions";
import { schemaToSearchFields } from "@components/search-bar/utils/utils";
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
import { CtrlKAtom, rootNavigationItems } from ".";
import { filterSuggestions, useSearchableEntities } from "./search-utils";

export const SearchCtrlK = () => {
  const [state, setState] = useRecoilState(CtrlKAtom);
  const currentState = state.path[state.path.length - 1] || {};

  const navigateAlt = useNavigateAlt();
  const close = () =>
    setState({
      path: [],
      selection: [],
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
      query: searchQuery,
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
        if (q || Math.abs(q.length - query.length) <= 1) setQuery(q); // Make sure the default query is set
        if (obj.valid) setSearchQuery(obj.fields);
      }}
      showExport={false}
      placeholder={"Search actions or items"}
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
              ...filterSuggestions(query, [
                ...searchableEntities.map((a) => ({
                  ...a,
                  label: `Rechercher dans '${a.label}'`,
                })),
                ...rootNavigationItems.map((a) => ({
                  ...a,
                  label: `Ouvrir '${a.label}'`,
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
                    value: a.label,
                    onClick: a.action,
                  } as Suggestions[0])
              ),
            ]
          : currentState.mode === "search"
          ? [
              {
                type: "navigation",
                value: query ? `Créer '${query}'` : "Créer un nouvel élément",
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
              },
              ...(items.data?.list || []).map(
                (a) =>
                  ({
                    type: "navigation",
                    value: a._label,
                    onClick: (event) => {
                      close();
                      setTimeout(() => {
                        navigateAlt(
                          // TODO Change me because url is not always linked to the entity
                          getRoute(
                            "/:client/" +
                              currentState.options?.entity +
                              "/" +
                              a.id
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
