import { InputDecorationIcon } from "@atoms/input/input-decoration-icon";
import { Input } from "@atoms/input/input-text";
import { debounce as delayCall } from "@features/utils/debounce";
import { SearchIcon } from "@heroicons/react/solid";
import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { buildFilter } from "./utils/filter";
import { useSuggestions } from "./hooks/use-suggestions";
import { SearchBarSuggestions } from "./suggestions";
import { OutputQuery, SearchField } from "./utils/types";
import { extractFilters, generateQuery } from "./utils/utils";

export const SearchBar = ({
  schema,
  onChange,
  debounce = 300,
}: {
  schema: { table: string; fields: SearchField[] };
  onChange: (str: OutputQuery) => void;
  debounce?: number;
}) => {
  const fields = schema.fields;
  const [value, setValue] = useState(
    new URLSearchParams(window.location.search).get("q") || ""
  );
  const rendererRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    suggestions,
    onKeyDown,
    applySelection,
    getSuggestions,
    selectionIndex,
    setSelectionIndex,
  } = useSuggestions(schema, inputRef, setValue);

  // When value change, set it to url querystring ?q=
  useEffect(() => {
    setSelectionIndex(0);

    const url = new URL(window.location.href);
    url.searchParams.set("q", value);
    window.history.replaceState({}, "", url.toString());
    delayCall(
      () => {
        onChange(generateQuery(fields, extractFilters(value)));
      },
      {
        key: "search-bar",
        timeout: debounce,
      }
    );
  }, [value]);

  // When value change, set inputHeight to rendererRef height
  useEffect(() => {
    if (rendererRef.current && inputRef.current) {
      inputRef.current.style.height = `${Math.max(
        36,
        rendererRef.current.scrollHeight + 2
      )}px`;
    }
  }, [value]);

  return (
    <div className="relative w-full group bg-white dark:bg-slate-990 rounded z-10">
      <div
        ref={rendererRef}
        style={{
          zIndex: -1,
          lineHeight: "1.5",
        }}
        className={twMerge(
          "break-all",
          "translate-y-px pointer-events-none select-none absolute w-full h-max left-0 top-0 text-sm px-3 py-1.5 border border-transparent",
          value && "font-mono",
          "pl-8"
        )}
      >
        {extractFilters(value).map((filter) => {
          return buildFilter(fields, filter);
        })}
      </div>
      <InputDecorationIcon
        prefix={(p) => <SearchIcon {...p} />}
        input={({ className }) => (
          <Input
            shortcut={["ctrl+f", "cmd+shift+f"]}
            onMouseUp={getSuggestions}
            onKeyUp={getSuggestions}
            onKeyDown={onKeyDown}
            style={{ resize: "none", lineHeight: "1.5" }}
            placeholder="Rechercher dans tous les champs..."
            inputRef={inputRef}
            spellCheck={false}
            multiline
            className={twMerge(
              "break-all",
              "z-10 !bg-transparent !dark:bg-transparent !text-transparent !dark:text-transparent caret-black dark:caret-white w-full py-1.5",
              suggestions.length > 0 && "focus:rounded-b-none",
              value && "font-mono",
              className
            )}
            value={value}
            onChange={(e) =>
              setValue(
                e.target.value?.replace(/\n/g, "").replace(/ +/g, " ") || ""
              )
            }
          />
        )}
      />
      {suggestions.length > 0 && (
        <div className="hidden group-focus-within:block hover:block text-sm z-10 absolute right-0 top-full w-full h-max shadow-md flex items-center bg-white dark:bg-wood-990 ring-1 ring-wood-500 border border-wood-500 rounded rounded-t-none px-2 py-1">
          <SearchBarSuggestions
            suggestions={suggestions}
            selected={selectionIndex}
            onClick={(i) => applySelection(i)}
          />
        </div>
      )}
    </div>
  );
};
