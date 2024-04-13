import { Tag } from "@atoms/badge/tag";
import { DropDownMenuType, Menu } from "@atoms/dropdown";
import { Checkbox } from "@atoms/input/input-checkbox";
import { Info } from "@atoms/text";
import { ReactNode } from "react";
import { SearchField } from "./utils/types";
import { Suggestions } from "./hooks/use-suggestions";

export const SearchBarSuggestions = ({
  suggestions,
  selected,
  onClick,
}: {
  suggestions: Suggestions;
  selected: number;
  onClick: (index: number) => void;
}) => {
  return (
    <Menu
      menu={[
        // When field is chosen, show the operations (invert, toggle fuzzy, add 'or' value, etc.)
        ...(suggestions.filter((a) => a.type === "operator").length
          ? ([
              {
                type: "label",
                label: <Info>Opérations</Info>,
                onClick: () => {},
              },
              ...suggestions
                .filter((a) => a.type === "operator")
                .map((a) => ({
                  type: "menu",
                  label: (
                    <span>
                      {((a as any).render || a.value) as string | ReactNode}
                    </span>
                  ),
                  onClick: () => {},
                })),
            ] as DropDownMenuType)
          : []),
        // Auto-suggest fields
        ...(suggestions.filter((a) => a.type === "field").length
          ? ([
              {
                type: "label",
                label: <Info>Filtres</Info>,
                onClick: () => {},
              },
              ...suggestions
                .filter((a) => a.type === "field")
                .map(({ value }, i) => ({
                  type: "menu",
                  label: (
                    <span>
                      <Tag
                        size="sm"
                        noColor
                        className="bg-wood-500 text-white -ml-1 font-mono"
                      >
                        {(value as SearchField).label}
                      </Tag>{" "}
                      {(value as SearchField).key}
                    </span>
                  ),
                  shortcut: i === selected ? ["enter"] : [],
                  active: i === selected,
                  onClick: () => onClick(i),
                })),
            ] as DropDownMenuType)
          : []),
        // Add suggested values, or date picker for date fields
        ...(suggestions.filter((a) => a.type === "value").length
          ? ([
              {
                type: "label",
                label: <Info>Valeurs</Info>,
                onClick: () => {},
              },
              ...suggestions
                .filter((a) => a.type === "value")
                .map((a) => ({
                  type: "menu",
                  label: (
                    <div className="flex flex-row space-x items-center">
                      <Checkbox size="sm" className="mr-2" value />
                      <span>{a.value as string | ReactNode}</span>
                    </div>
                  ),
                  onClick: () => {},
                })),
            ] as DropDownMenuType)
          : []),
      ]}
    />
  );
};
