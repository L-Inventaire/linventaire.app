import { Button } from "@atoms/button/button";
import { Modal } from "@atoms/modal/modal";
import { SearchBar } from "@components/search-bar";
import { Suggestions } from "@components/search-bar/hooks/use-suggestions";
import { schemaToSearchFields } from "@components/search-bar/utils/utils";
import { getRoute } from "@features/routes";
import { normalizeString } from "@features/utils/format/strings";
import { useNavigateAlt } from "@features/utils/navigate";
import {
  RestSearchQuery,
  useRest,
  useRestSchema,
} from "@features/utils/rest/hooks/use-rest";
import { RestEntity } from "@features/utils/rest/types/types";
import { XMarkIcon } from "@heroicons/react/16/solid";
import Fuse from "fuse.js";
import _ from "lodash";
import { useState } from "react";
import { atom, useRecoilState } from "recoil";

/*
[selection] Scenario 1:
- Select items in a list of contacts
- Click on Ctrl+K
- A list of actions and keys to modify will be proposed, and filtered by the search input
- Select key "tags"
- We are now in "search" mode for tags, in addition to results we have actions, like "cancel" and "+ Current Query", tags used in all selection appears as "delete XXX"
- Creating a tag  create it and affect it to the selected contacts
- Ctrl+K is closed and list should refresh in the background

[selection] Scenario 2:
- Select items in a list of contacts
- Click on Ctrl+K
- A list of actions and keys to modify will be proposed, and filtered by the search input
- Select key "parents"
- We are now in "search" mode for other contacts, in addition to results we have actions, like "cancel" and "+ Current Query", contacts used in all selection appears as "delete XXX"
- Creating a parent happens in the ctrl+K modal
- When done, we get back to "search" previous path, but with query set to the new parent's label

[search] Scenario 3:
- Click on Ctrl+K without selection
- A list of entities is proposed, like "contacts", "tags", "invoices", as well as a list of actions (go to invoices etc)
- Search can filter this actions by keyword (ex. "invoice")
- Select "Search Invoices"
- We are now in "search" mode but for entity_type "invoices"
- We can search for invoices, when selecting one, it opens it and close the ctrl+K
*/

type CtrlKPathOptionType<T> = {
  query: string; // Current query
};

type CtrlKPathType<T> = {
  mode:
    | "action" // Search actions to apply on selection
    | "search" // Search items
    | "create"; // Create a new item (enlarge the modal)
  entity?: string; // Search entity (ex. "contacts")
  options?: CtrlKPathOptionType<T>; // Additional options for any mode
};

type CtrlKOptionsType = {
  label: string;
  keywords?: string[];
  priority?: number;
  icon?: (p: any) => React.ReactNode;
  action?: (event: MouseEvent) => void;
  to?: string;
};

export type CtrlKStateType<T> = {
  path: CtrlKPathType<T>[]; // Empty: not open, else: path to current state, for instance
  selection: T[]; // For actions, the selected items on which the action will be applied
};

export const CtrlKAtom = atom<CtrlKStateType<any>>({
  key: "CtrlKAtom",
  default: {
    path: [],
    selection: [],
  },
});

let rootNavigationItems: CtrlKOptionsType[] = [];
export const registerRootNavigation = (
  options: CtrlKOptionsType & { to: string }
) => {
  rootNavigationItems = [
    ...rootNavigationItems.filter((a) => a.to !== options.to),
    options,
  ];
};

let useSearchableEntities = () => {
  const [state, setState] = useRecoilState(CtrlKAtom);

  const getAction = (entity: string, query?: string) => () => {
    setState({
      ...state,
      path: [
        ...state.path,
        {
          mode: "search",
          entity: entity,
          options: { query: query || "" },
        },
      ],
    });
  };

  return [
    {
      label: "Contacts",
      keywords: ["contact", "person", "people", "client", "fournisseur"],
      action: getAction("contacts"),
    },
    {
      label: "Clients",
      keywords: [],
      action: getAction("contacts", "is_client:1 "),
    },
    {
      label: "Fournisseurs",
      keywords: [],
      action: getAction("contacts", "is_supplier:1 "),
    },
  ];
};

const filterSuggestions = (query: string, suggestions: CtrlKOptionsType[]) => {
  const availableSuggestions = suggestions.map((f) => ({
    labels: normalizeString(f.label + " " + f.keywords?.join(" "))
      .toLocaleLowerCase()
      .replace(/[^a-z]/gm, " ")
      .split(" ")
      .map((s) => s.toLowerCase().slice(0, query?.length || 1000)),
    key: f,
  }));

  const fuse = new Fuse(availableSuggestions, {
    includeScore: true,
    threshold: 0.6,
    keys: ["labels"],
  });

  let result = fuse
    .search(query || "")
    .filter((a: any) =>
      a.item.labels.some(
        (b: string) => normalizeString(b)[0] === normalizeString(query)[0]
      )
    )
    .map((a: any) => a.item.key as CtrlKOptionsType);

  if (!query.trim()) result = suggestions;

  return _.sortBy(result, (a) => -(a.priority || 0)) as CtrlKOptionsType[];
};

export const CtrlKModal = () => {
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
  const schema = useRestSchema(currentState.entity || "");
  const { items } = useRest<RestEntity & any>(currentState.entity || "", {
    limit: 50,
    query: searchQuery,
    key: "crtl-k-" + currentState.entity + "-" + state.path.length,
  });

  console.log("currentState", currentState.options);

  return (
    <Modal
      open={state.path.length > 0}
      closable={false}
      positioned
      style={{
        marginTop: "10vh",
        maxHeight: "80vh",
        maxWidth: currentState.mode === "search" ? "1200px" : "",
      }}
    >
      <div className="-m-6" style={{ maxHeight: "inherit" }}>
        <SearchBar
          inlineSuggestions
          autoFocus
          urlSync={false}
          inputClassName="py-2"
          schema={
            currentState.mode === "search"
              ? {
                  table: currentState.entity || "",
                  fields: schemaToSearchFields(schema.data),
                }
              : { table: "ctrl+k", fields: [] }
          }
          value={query}
          onChange={(obj, q) => {
            setQuery(q);
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
                                "/:client/" + currentState.entity + "/" + a.id
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
      </div>
    </Modal>
  );
};
