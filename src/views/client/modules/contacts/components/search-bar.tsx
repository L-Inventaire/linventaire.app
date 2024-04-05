import { Input } from "@atoms/input/input-text";
import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

type SearchField = {
  label: string;
  key: string;
  type: "text" | "date" | "number" | "boolean";
  search?: (query: string) => Promise<{ value: any; label: string }[]>;
};

const labelToVariable = (label: string) =>
  label.toLowerCase().replace(/[^a-z0-9]/g, "_");

// Filters have this form: field:"value with spaces","value2","value3" or just field:value,value2
const extractFilters = (str: string) => {
  const filters =
    str.match(/([^ :]+:([^" ]+|("[^"]+("|$),?)+[^" ]*)|[^ ]+)/gm) || [];
  return filters.map((filter) => {
    const parts = filter.match(/(([^ :]+):([^" ]+|("[^"]+("|$),?)+[^" ]*)?)/);
    if (!parts) return { key: "", raw: filter, values: [], values_raw: "" };
    const key = parts[2];
    const values = (parts[3] || "").match(/("[^"]+("|$)|[^,]+)/g) || [];
    return {
      key,
      raw: filter,
      values_raw: parts[3] || "",
      values: values
        .map((value) => value.replace(/^"(.*?)("|$)$/g, "$1"))
        .filter(Boolean),
    };
  });
};

export const SearchBar = () => {
  const [value, setValue] = useState("Fake content");
  const rendererRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fields: SearchField[] = [
    {
      label: "Name",
      key: "name",
      type: "text",
      search: async (query: string) => [
        { value: 1, label: "example1" },
        { value: 2, label: "example2" },
      ],
    },
    {
      label: "Tags",
      key: "tags",
      type: "text",
      search: async (query: string) => [
        { value: 1, label: "Tag 1" },
        { value: 2, label: "Tag 2" },
      ],
    },
    {
      label: "Date",
      key: "date",
      type: "date",
    },
    {
      label: "Number",
      key: "number",
      type: "number",
    },
    {
      label: "Boolean",
      key: "boolean",
      type: "boolean",
    },
  ];

  // When value change, set inputHeight to rendererRef height
  useEffect(() => {
    if (rendererRef.current && inputRef.current) {
      inputRef.current.style.height = `${Math.max(
        38,
        rendererRef.current.scrollHeight + 2
      )}px`;
    }
  }, [value]);

  return (
    <div className="relative w-full group">
      <div
        ref={rendererRef}
        className={twMerge(
          "pointer-events-none select-none absolute w-full h-max left-0 top-0 text-sm px-3 py-2 border border-transparent",
          value && "font-mono"
        )}
      >
        {extractFilters(value).map((filter) => {
          return fields
            .map((a) => labelToVariable(a.label))
            .includes(filter.key) ? (
            <>
              <span
                className={twMerge(
                  "bg-wood-500 bg-opacity-10 border border-wood-500 border-r-0 font-bold rounded-sm rounded-r-none"
                )}
                style={{
                  marginLeft: "-0.5ch",
                  paddingLeft: "calc(0.5ch - 1px)",
                  paddingRight: "calc(0.5ch - 1px)",
                }}
              >
                {filter.key}
              </span>
              <span
                style={{
                  paddingLeft: "calc(0.5ch)",
                  paddingRight: "calc(0.5ch - 1px)",
                  marginRight: "calc(0.5ch + 1px)",
                }}
                className={twMerge(
                  "bg-wood-500 text-wood-500 bg-opacity-10 border border-wood-500 border-l-0 rounded-sm rounded-l-none"
                )}
              >
                {filter.values.join(", ")}
                <span
                  style={{
                    width:
                      filter.values_raw.length -
                      filter.values.join(", ").length +
                      "ch",
                  }}
                  className="inline-block"
                />
                {false &&
                  filter.values.map((tag, i) => (
                    <span
                      style={{
                        paddingLeft:
                          i === 0 && filter.values.length > 0
                            ? "calc(2ch)"
                            : "calc(1ch)",
                        paddingRight: "calc(1ch)",
                      }}
                    >
                      {tag.replace(/("$|^")/g, "")}
                    </span>
                  ))}
              </span>
            </>
          ) : (
            <span className="whitespace-pre">{filter.raw + " "}</span>
          );
        })}
      </div>
      <Input
        style={{ resize: "none" }}
        placeholder="Rechercher dans tous les champs..."
        inputRef={inputRef}
        spellCheck={false}
        multiline
        className={twMerge(
          "text-transparent caret-black dark:caret-white w-full focus:rounded-b-none",
          value && "font-mono"
        )}
        value={value}
        onChange={(e) =>
          setValue(e.target.value?.replace(/\n/g, "").replace(/ +/g, " ") || "")
        }
      />
      <div className="hidden group-focus-within:block text-sm z-10 absolute right-0 top-full w-full h-max shadow-md flex items-center pr-2 bg-white ring-1 ring-wood-500 border border-wood-500 rounded rounded-t-none p-4">
        Yo
        <br />
        And more
      </div>
    </div>
  );
};
