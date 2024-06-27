import { normalizeString } from "@features/utils/format/strings";
import Fuse from "fuse.js";
import _ from "lodash";
import { useRecoilState } from "recoil";
import { CtrlKOptionsType } from "./types";
import { CtrlKAtom } from ".";

export const useSearchableEntities = () => {
  const [state, setState] = useRecoilState(CtrlKAtom);

  const getAction = (entity: string, query?: string) => () => {
    setState({
      ...state,
      path: [
        ...state.path,
        {
          mode: "search",
          options: { query: query || "", entity: entity },
        },
      ],
    });
  };

  return [
    {
      label: "Contacts",
      keywords: ["contact", "person", "people"],
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

export const filterSuggestions = (
  query: string,
  suggestions: CtrlKOptionsType[]
) => {
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

  // TODO: maybe add a better sorting algorithm to include fuze score
  // TODO: most important: if found in the keywords, then after the ones found in main label
  return _.sortBy(result, (a) => -(a.priority || 0)) as CtrlKOptionsType[];
};
