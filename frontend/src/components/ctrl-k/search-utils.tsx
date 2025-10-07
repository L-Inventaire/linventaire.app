import { normalizeString } from "@features/utils/format/strings";
import Fuse from "fuse.js";
import _ from "lodash";
import { useRecoilState } from "recoil";
import { CtrlKOptionsType } from "@features/ctrlk/types";
import { CtrlKAtom } from "@features/ctrlk/store";
import { useTranslation } from "react-i18next";

export const useSearchableEntities = (stateId: string) => {
  const { t } = useTranslation();
  const [states, setStates] = useRecoilState(CtrlKAtom);

  const state = states.find((s) => s.id === stateId);
  const setState = (newState: any) => {
    setStates((states) => {
      const newStates = [...states];
      const targetIndex = newStates.findIndex((s) => s.id === stateId);
      if (targetIndex !== -1) {
        newStates[targetIndex] = newState;
      }
      return newStates;
    });
  };

  if (!state) {
    return []; // Return empty array if state not found
  }

  const getAction =
    (entity: string, query?: string, internalQuery?: any) => () => {
      setState({
        ...state,
        path: [
          ...state.path,
          {
            mode: "search",
            options: { query: query || "", entity: entity, internalQuery },
          },
        ],
      });
    };

  return [
    {
      label: t("entities.contacts.titles.plural"),
      keywords: t("entities.contacts.titles.keywords").split(","),
      action: getAction("contacts"),
    },
    {
      label: t("entities.contacts.titles.clients_plural"),
      keywords: t("entities.contacts.titles.clients_keywords").split(","),
      action: getAction("contacts", "is_client:1 "),
    },
    {
      label: t("entities.contacts.titles.suppliers_plural"),
      keywords: t("entities.contacts.titles.suppliers_keywords").split(","),
      action: getAction("contacts", "is_supplier:1 "),
    },
    {
      label: t("entities.articles.titles.plural"),
      keywords: t("entities.articles.titles.keywords").split(","),
      action: getAction("articles"),
    },
    {
      label: t("entities.invoices.titles.quotes_plural"),
      keywords: t("entities.invoices.titles.quotes_keywords").split(","),
      action: getAction("invoices", "", { type: "quotes" }),
    },
    {
      label: t("entities.invoices.titles.invoices_plural"),
      keywords: t("entities.invoices.titles.invoices_keywords").split(","),
      action: getAction("invoices", "", { type: "invoices" }),
    },
    {
      label: t("entities.invoices.titles.credit_notes_plural"),
      keywords: t("entities.invoices.titles.credit_notes_keywords").split(","),
      action: getAction("invoices", "", { type: "credit_notes" }),
    },
    {
      label: t("entities.invoices.titles.supplier_quotes_plural"),
      keywords: t("entities.invoices.titles.supplier_quotes_keywords").split(
        ","
      ),
      action: getAction("invoices", "", { type: "supplier_quotes" }),
    },
    {
      label: t("entities.invoices.titles.supplier_invoices_plural"),
      keywords: t("entities.invoices.titles.supplier_invoices_keywords").split(
        ","
      ),
      action: getAction("invoices", "", {
        type: ["supplier_invoices", "supplier_credit_note"],
      }),
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
