import { Tag } from "@atoms/badge/tag";
import { DropDownMenuType, Menu } from "@atoms/dropdown";
import { Checkbox } from "@atoms/input/input-checkbox";
import { Info, InfoSmall } from "@atoms/text";
import { RestTag } from "@components/rest-tags";
import { ReactNode } from "react";
import { Suggestions } from "./hooks/use-suggestions";
import { formatTime } from "@features/utils/format/dates";
import { twMerge } from "tailwind-merge";

export const SearchBarSuggestions = ({
  suggestions,
  selected,
  afterOnClick,
}: {
  suggestions: Suggestions;
  selected: number;
  afterOnClick: () => void;
}) => {
  const operators = suggestions.filter((a) => a.type === "operator");
  const fields = suggestions.filter((a) => a.type === "field");
  const values = suggestions.filter((a) => a.type === "value");
  return (
    <Menu
      menu={[
        // Add suggested values, or date picker for date fields
        ...(values.length
          ? ([
              {
                type: "label",
                label: <Info>Valeurs</Info>,
                onClick: () => {},
              },
              ...values.map((a: Suggestions[0], i) => ({
                type: "menu",
                className: "group/item",
                label: (
                  <div className="flex flex-row space-x items-center overflow-hidden text-ellipsis whitespace-nowrap">
                    <Checkbox size="sm" className="mr-2" value={a.active} />
                    {a.field?.type.indexOf("type:") !== 0 && (
                      <span>{(a.render || a.value) as string | ReactNode}</span>
                    )}
                    {a.field?.type.indexOf("type:") === 0 && (
                      <RestTag
                        type={a.field?.type.split(":")[1] as string}
                        size="sm"
                        label={a.render}
                        item={a.item}
                        id={a.value}
                      />
                    )}
                    <InfoSmall
                      className={twMerge(
                        "ml-1 group-hover/item:opacity-100 opacity-0",
                        i === selected && "opacity-100"
                      )}
                    >
                      {!!a.count && (
                        <>
                          {" • "}
                          {a.count > 10 ? "~" : ""}
                          {a.count} documents
                        </>
                      )}
                      {!!a.updated && (
                        <>
                          {" • "}dernière utilisation
                          {" " + formatTime(a.updated, { keepTime: false })}
                        </>
                      )}
                    </InfoSmall>
                  </div>
                ),
                shortcut: i === selected ? ["enter"] : [],
                active: i === selected,
                onClick: () => {
                  a.onClick?.();
                  afterOnClick();
                },
              })),
            ] as DropDownMenuType)
          : []),
        // Auto-suggest fields
        ...(fields.length
          ? ([
              {
                type: "label",
                label: <Info>Filtres</Info>,
                onClick: () => {},
              },
              ...fields.map(({ field, onClick }, i) => ({
                type: "menu",
                label: (
                  <span>
                    <Tag
                      size="sm"
                      noColor
                      className="bg-wood-500 text-white -ml-1 font-mono"
                    >
                      {field?.label}
                    </Tag>{" "}
                    {field?.key}
                  </span>
                ),
                shortcut: i + values.length === selected ? ["enter"] : [],
                active: i + values.length === selected,
                onClick: () => {
                  onClick?.();
                  afterOnClick();
                },
              })),
            ] as DropDownMenuType)
          : []),
        // When field is chosen, show the operations (invert, toggle fuzzy, add 'or' value, etc.)
        ...(operators.length
          ? ([
              {
                type: "label",
                label: <Info>Opérations</Info>,
                onClick: () => {},
              },
              ...operators.map((a, i) => ({
                type: "menu",
                label: (
                  <span>
                    {((a as any).render || a.value) as string | ReactNode}
                  </span>
                ),
                shortcut:
                  i + fields.length + values.length === selected
                    ? ["enter"]
                    : [],
                active: i + fields.length + values.length === selected,
                onClick: () => {
                  a.onClick?.();
                  afterOnClick();
                },
              })),
            ] as DropDownMenuType)
          : []),
      ]}
    />
  );
};
