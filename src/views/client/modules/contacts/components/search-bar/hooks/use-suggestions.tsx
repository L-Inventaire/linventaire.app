import { Tag } from "@atoms/badge/tag";
import { debounce } from "@features/utils/debounce";
import { useRestSuggestions } from "@features/utils/rest/hooks/use-rest";
import Fuse from "fuse.js";
import _ from "lodash";
import { ReactNode, useEffect, useRef, useState } from "react";
import { SearchField } from "../utils/types";
import { labelToVariable } from "../utils/utils";
import { useCaret } from "./use-caret";
import { Info } from "@atoms/text";

export type Suggestions = {
  type: "operator" | "field" | "value";
  field?: SearchField;

  value:
    | (
        | "invert" // Toggle "!""
        | "fuzzy" // Toggle "~"
        | "finish"
      )
    | string; // Goes to next filter (finish values and add space)
  onClick?: () => void;

  render?: string | ReactNode; // A special rendered item

  // Special sub entities
  item?: any; // The item from the rest api when special type (ex. type:tags)
  active?: boolean; // If this item is selected in the active filter
  count?: number; // Number of documents with this value
  updated?: number; // Last time this value was used in a document
}[];

export const useSuggestions = (
  schema: { table: string; fields: SearchField[] },
  inputRef: React.RefObject<HTMLInputElement>,
  setValue: (value: string) => void,
  initialDisplayToValueMap: any
) => {
  const fields = schema.fields;
  const { getCaretPosition, replaceAtCursor } = useCaret(inputRef, setValue);
  const [mode, setMode] = useState<"field" | "value">("field");
  const [currentFilterValues, setCurrentFilterValues] = useState<string[]>([]);
  const [columnSearch, setColumnSearch] = useState<[string, string]>(["", ""]); // [Column, query]
  const [_suggestions, setSuggestions] = useState<Suggestions>([]);
  const [selectionIndex, setSelectionIndex] = useState(0);
  const displayToValueMap = useRef<{
    [key: string]: string;
  }>(initialDisplayToValueMap || {});
  const status = getCaretPosition();

  const [recentSearches, setRecentSearches] = useState<string[]>(
    JSON.parse(localStorage.getItem("search-recent-" + schema.table) || "[]")
  );
  const [popularFilters, setPopularFilters] = useState<string[]>(
    JSON.parse(
      localStorage.getItem("search-popular-filters-" + schema.table) || "[]"
    )
  );

  useEffect(() => {
    localStorage.setItem(
      "search-recent-" + schema.table,
      JSON.stringify(recentSearches)
    );
    localStorage.setItem(
      "search-popular-filters-" + schema.table,
      JSON.stringify(popularFilters)
    );
  }, [recentSearches, popularFilters]);

  const { suggestions: restColumnSuggestions } =
    useRestSuggestions<SearchField>(
      schema.table,
      columnSearch[0],
      columnSearch[1]
    );

  useEffect(() => {
    setSelectionIndex(0);
  }, [_suggestions.length]); // Keep position if we just added a value

  const suggestions = [
    ...(mode === "value"
      ? ((restColumnSuggestions.data || []).map((a) => ({
          type: "value",
          field: fields.find((f) => f.key === columnSearch[0]),
          value: a.value,
          render: a.label,
          item: a.item,
          count: a.count,
          updated: a.updated,
          active: currentFilterValues.includes(a.value),
          onClick: () => {
            const status = getCaretPosition();
            const field = fields.find((f) => f.key === columnSearch[0]);
            const currentSearchValueIndex = status.value?.index || 0;
            const inputValue = a.label || a.value;
            const inSearchMode = false; // TODO: We need to differentiate when we are filtering and when we got back to the filter
            // Update list of values
            const alreadyHasValue = currentFilterValues
              .filter((_, i) => i !== currentSearchValueIndex || !inSearchMode)
              .includes(a.value);
            const values = (status.filter?.values || [])
              .filter((_, i) => i !== currentSearchValueIndex || !inSearchMode)
              .filter((c) => c !== inputValue);
            const wasFirstValue = !alreadyHasValue && values.length === 0;
            if (!alreadyHasValue) {
              values.push(inputValue);
            }
            const isText =
              field?.type === "text" || values.some((a) => a.indexOf(" ") >= 0);
            let word =
              (status.filter?.not ? "!" : "") +
              field?.key +
              ":" +
              (status.filter?.regex ? "~" : "") +
              (isText ? '"' : "") +
              values.join(isText ? '","' : ",") +
              (isText ? '"' : "");

            //Go to next filter if we just added the first value, or stay in filter otherwise
            word += wasFirstValue ? " " : "";
            const cursorOffsetFromEnd =
              (wasFirstValue || values.length === 0) && isText ? -1 : 0;

            if (alreadyHasValue) {
              displayToValueMap.current = Object.fromEntries(
                Object.entries(displayToValueMap.current).filter(
                  ([key]) => key !== field?.key + ":" + inputValue
                )
              );
            } else {
              displayToValueMap.current = {
                ...displayToValueMap.current,
                [field?.key + ":" + inputValue]: a.value,
              };
            }

            replaceAtCursor(word, cursorOffsetFromEnd);
          },
        })) as Suggestions)
      : []),
    ..._suggestions,
  ];

  const afterApplySelection = () => {
    getSuggestions();
  };

  const onKeyDown = (e: any) => {
    // Manage arrow keys
    if (e.key === "Backspace" || e.key === "Delete") {
      // TODO Remove current value or tag
      // TODO do it for all keys?
      if (false) {
        e.preventDefault();
        e.stopPropagation();
      }
      return;
    }

    // Manage arrow keys
    if (e.key === "ArrowUp") {
      e.preventDefault();
      e.stopPropagation();
      setSelectionIndex(Math.max(0, selectionIndex - 1));
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      e.stopPropagation();
      setSelectionIndex(Math.min(suggestions.length - 1, selectionIndex + 1));
      return;
    }

    if (e.key === "Enter" || e.key === "Tab" || e.key === ":") {
      if (suggestions.length === 0) return;
      e.preventDefault();
      e.stopPropagation();
      if (suggestions[selectionIndex] && suggestions[selectionIndex].onClick) {
        suggestions[selectionIndex].onClick?.();
      }
      afterApplySelection();
      return;
    }
  };

  const getSuggestions = () => {
    const status = getCaretPosition();
    setCurrentFilterValues(
      (status.filter?.values || []).map(
        (a) => displayToValueMap.current[status.filter?.key + ":" + a] || a
      )
    );

    if (status.text.current?.indexOf(":") === -1) {
      // Choosing a filter

      const fieldTyped = status.text.current.split(":")[0] || "";

      const availableFields = fields.map((f) => ({
        labels: (f.label + " " + f.key)
          .replace(/[^a-z]/gm, " ")
          .split(" ")
          .map((s) => s.toLowerCase().slice(0, fieldTyped?.length || 1000)),
        key: f.key,
      }));

      const fuse = new Fuse(availableFields, {
        includeScore: true,
        threshold: 0.6,
        keys: ["labels"],
      });
      const result = fuse
        .search(fieldTyped || "")
        .filter((a: any) =>
          a.item.labels.some((b: string) => b[0] === fieldTyped[0])
        );

      const resultFields = fieldTyped
        ? _.sortBy(
            result
              .map((r: any) => ({
                score: r.score,
                ...fields.find((a) => a.key === r.item.key),
              }))
              .filter(Boolean),
            "score",
            (r) => r.label.length
          )
        : []; // _.sortBy(fields, "label"); // TODO for now it seems more great to show nothing when we start in the field

      setMode("field");
      setSuggestions(
        resultFields.slice(0, 5).map((activeField: SearchField) => ({
          type: "field",
          field: activeField,
          value: activeField.key,
          onClick: () => {
            const status = getCaretPosition();
            const field = fields.find(
              (a) => labelToVariable(a.label) === activeField?.label
            );
            const defaultSuffix =
              field?.type === "text"
                ? ':~""'
                : field?.type === "boolean"
                ? ":1"
                : ":";
            const defaultOffset = field?.type === "text" ? -1 : 0;
            const currentValue = status.text?.current?.split(":")[1] || "";
            replaceAtCursor(
              labelToVariable(activeField?.label || "") +
                (currentValue ? ":" + currentValue : defaultSuffix),
              defaultOffset
            );
          },
        }))
      );
    } else {
      const field = schema.fields.find(
        (a) => labelToVariable(a.label) === status.filter?.key
      );

      console.log(status);

      const column = status.filter?.key || "";
      const query = ""; //status.filter?.values[status.value?.index || 0] || "";
      debounce(
        () => {
          setColumnSearch([column, query]);
        },
        {
          key: "search-bar-suggestions",
          timeout: 1000,
        }
      );

      // Inside a filter's value
      setMode("value");
      setSuggestions([
        ...(status.filter?.values.length
          ? ([
              {
                type: "operator",
                value: "finish",
                onClick: () => {
                  const status = getCaretPosition();
                  replaceAtCursor(
                    status.text.current.replace(/,"*$/, "") + " ",
                    0
                  );
                },
                render: (
                  <span>
                    <Info className="inline-block w-4 text-center mr-2">✓</Info>
                    Sortir du filtre
                  </span>
                ),
              },
              {
                type: "operator",
                value: "add",
                onClick: () => {
                  const status = getCaretPosition();
                  const field = fields.find((f) => f.key === columnSearch[0]);
                  replaceAtCursor(
                    status.text.current +
                      (field?.type === "text" ? ',""' : ","),
                    field?.type === "text" ? -1 : 0
                  );
                },
                render: (
                  <span>
                    {" "}
                    <Info className="inline-block w-4 text-center mr-2">+</Info>
                    Ajouter une autre valeur
                  </span>
                ),
              },
              {
                type: "operator",
                value: "invert",
                onClick: () => {
                  const status = getCaretPosition();
                  const word = ("!" + status.text.current).replace(/^!!/g, "");
                  const cursorOffsetFromEnd =
                    status.caret.current - status.caret.after;
                  replaceAtCursor(word, cursorOffsetFromEnd);
                },
                render: (
                  <span>
                    <Info className="inline-block w-4 text-center mr-2">!</Info>
                    {status.filter.not
                      ? "Ne pas inverser la condition"
                      : "Inverser la condition"}
                  </span>
                ),
              },
            ] as Suggestions)
          : []),
        ...(field?.type === "text"
          ? ([
              {
                type: "operator",
                value: "fuzzy",
                onClick: () => {
                  const status = getCaretPosition();
                  let word = status.text.current.replace(/:"/, ':~"');
                  if (status.text.current.split(":")[1].indexOf('~"') === 0) {
                    word = status.text.current.replace(/:~"/, ':"');
                  }
                  const cursorOffsetFromEnd =
                    status.caret.current - status.caret.after;
                  replaceAtCursor(word, cursorOffsetFromEnd);
                },
                render: (
                  <span>
                    <Info className="inline-block w-4 text-center mr-2">~</Info>
                    Recherche exacte / proche
                  </span>
                ),
              },
            ] as Suggestions)
          : []),
      ]);
    }
  };

  return {
    suggestions,
    onKeyDown,
    getSuggestions,
    selectionIndex,
    afterApplySelection,
    displayToValueMap: displayToValueMap.current,
  };
};
