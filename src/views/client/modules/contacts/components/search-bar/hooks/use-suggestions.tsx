import { Tag } from "@atoms/badge/tag";
import Fuse from "fuse.js";
import { ReactNode, useState } from "react";
import { SearchField } from "../utils/types";
import { labelToVariable } from "../utils/utils";
import { useCaret } from "./use-caret";

export type Suggestions = (
  | {
      type: "operator";
      value:
        | "invert" // Toggle "!""
        | "fuzzy" // Toggle "~"
        | "finish"; // Goes to next filter (finish values and add space)
      render: string | ReactNode;
    }
  | {
      type: "field";
      value: SearchField;
    }
  | {
      type: "value";
      value: string;
      render?: string | ReactNode;
    }
)[];

export const useSuggestions = (
  fields: SearchField[],
  inputRef: React.RefObject<HTMLInputElement>,
  setValue: (value: string) => void
) => {
  const [suggestions, setSuggestions] = useState<Suggestions>([]);
  const [selectionIndex, setSelectionIndex] = useState(0);

  const { getCaretPosition, replaceAtCursor } = useCaret(inputRef, setValue);

  const applySelection = (index: number) => {
    if (suggestions[index] && suggestions[index].type === "field") {
      const currentValue =
        getCaretPosition().text?.current?.split(":")[1] || "";
      replaceAtCursor(
        labelToVariable((suggestions[index].value as SearchField).label) +
          (currentValue ? ":" + currentValue : ':~""'),
        -1
      );
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

    if (status.text.current?.indexOf(":") === -1) {
      // TODO if we are currently caret before the ":" then we can change the field
      // Choosing a filter

      const availableFields = fields.map((f) => ({
        labels: (f.label + " " + f.key)
          .replace(/[^a-z]/gm, " ")
          .split(" ")
          .map((s) =>
            s.toLowerCase().slice(0, (status.text.current?.length || 1000) - 1)
          ),
        key: f.key,
      }));

      const fuse = new Fuse(availableFields, {
        includeScore: true,
        threshold: 0.6,
        keys: ["labels"],
      });
      const result = fuse.search(status.text.current || "");
      setSuggestions(
        (status.text.current
          ? result
              .map((r: any) => fields.find((a) => a.key === r.item.key))
              .filter(Boolean)
          : fields
        )
          .slice(0, 5)
          .map((a: SearchField) => ({ type: "field", value: a }))
      );
    } else {
      // Inside a filter's value
      setSuggestions([
        {
          type: "operator",
          value: "finish",
          render: <span>Terminer</span>,
        },
        {
          type: "operator",
          value: "invert",
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
        {
          type: "operator",
          value: "fuzzy",
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
        ...((status.filter?.values || []).map((v) => ({
          type: "value",
          value: v,
        })) as Suggestions),
      ]);
    }
  };

  return {
    suggestions,
    onKeyDown,
    getSuggestions,
    setSelectionIndex,
    applySelection,
  };
};
