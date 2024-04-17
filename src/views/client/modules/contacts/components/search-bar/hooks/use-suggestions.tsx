import { Tag } from "@atoms/badge/tag";
import { debounce } from "@features/utils/debounce";
import { useRestSuggestions } from "@features/utils/rest/hooks/use-rest";
import Fuse from "fuse.js";
import _ from "lodash";
import { ReactNode, useState } from "react";
import { SearchField } from "../utils/types";
import { labelToVariable } from "../utils/utils";
import { useCaret } from "./use-caret";

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
  render?: string | ReactNode;
  onClick?: () => void;
}[];

export const useSuggestions = (
  schema: { table: string; fields: SearchField[] },
  inputRef: React.RefObject<HTMLInputElement>,
  setValue: (value: string) => void
) => {
  const fields = schema.fields;
  const [mode, setMode] = useState<"field" | "value">("field");
  const [columnSearch, setColumnSearch] = useState<[string, string]>(["", ""]); // [Column, query]
  const [_suggestions, setSuggestions] = useState<Suggestions>([]);
  const [selectionIndex, setSelectionIndex] = useState(0);

  const { suggestions: restColumnSuggestions } =
    useRestSuggestions<SearchField>(
      schema.table,
      columnSearch[0],
      columnSearch[1]
    );

  const suggestions = [
    ..._suggestions,
    ...(mode === "value"
      ? ((restColumnSuggestions.data || []).map((a) => ({
          type: "value",
          value: a.value,
          render: a.label,
        })) as Suggestions)
      : []),
  ];

  const { getCaretPosition, replaceAtCursor } = useCaret(inputRef, setValue);

  const applySelection = (index: number) => {
    if (suggestions[index] && suggestions[index].onClick) {
      suggestions[index].onClick?.();
    }
    getSuggestions();
  };

  const onKeyDown = (e: any) => {
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
      applySelection(selectionIndex);
      return;
    }
  };

  const getSuggestions = () => {
    const status = getCaretPosition();

    if (
      status.text.current
        .slice(0, status.caret.current - status.caret.before)
        ?.indexOf(":") === -1
    ) {
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
        : _.sortBy(fields, "label");

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

      const column = status.filter?.key || "";
      const query = status.filter?.values[0] || "";
      debounce(
        () => {
          setColumnSearch([column, query]);
        },
        {
          key: "search-bar-suggestions",
          timeout: 1000,
        }
      );

      console.log("status.value", status.value);

      // Inside a filter's value
      setMode("value");
      setSuggestions([
        {
          type: "operator",
          value: "finish",
          onClick: () => {
            const status = getCaretPosition();
            replaceAtCursor(status.text.current + " ", 0);
          },
          render: <span>Terminer</span>,
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
              <Tag
                size="sm"
                noColor
                className="bg-red-500 text-white -ml-1 text-center items-center justify-center font-mono"
              >
                !
              </Tag>{" "}
              Inverser
            </span>
          ),
        },
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
                    <Tag
                      size="sm"
                      noColor
                      className="bg-wood-500 text-white -ml-1 text-center items-center justify-center font-mono"
                    >
                      ~
                    </Tag>{" "}
                    Fuzzy
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
    setSelectionIndex,
    selectionIndex,
    applySelection,
  };
};
