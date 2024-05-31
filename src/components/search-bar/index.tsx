import { InputDecorationIcon } from "@atoms/input/input-decoration-icon";
import { Input } from "@atoms/input/input-text";
import { useTableFields } from "@features/fields/hooks/use-fields";
import { debounce as delayCall } from "@features/utils/debounce";
import { normalizeString } from "@features/utils/format/strings";
import {
  FunnelIcon,
  ChevronUpDownIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { Fragment, useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { useSuggestions } from "./hooks/use-suggestions";
import { SearchBarSuggestions } from "./suggestions";
import { buildFilter } from "./utils/filter";
import { OutputQuery, SearchField } from "./utils/types";
import { extractFilters, generateQuery } from "./utils/utils";
import { useLocation } from "react-router-dom";
import { Button } from "@atoms/button/button";

export const SearchBar = ({
  schema,
  onChange,
  debounce = 300,
  className,
  suffix,
}: {
  schema: { table: string; fields: SearchField[] };
  onChange: (str: OutputQuery) => void;
  debounce?: number;
  className?: string;
  suffix?: JSX.Element;
}) => {
  const { fields: customFields, loading: loadingCustomFields } = useTableFields(
    schema.table
  );
  schema.fields = schema.fields.map((a) => {
    const cf = customFields.find((b) => "fields." + b.code === a.key);
    if (cf) {
      return {
        ...a,
        keywords: [...a.keywords, normalizeString(cf.name)],
        label: cf.name,
      };
    }
    return a;
  });
  const fields = schema.fields;

  const [value, setValue] = useState(
    new URLSearchParams(window.location.search).get("q") || ""
  );
  const rendererRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { search } = useLocation();
  useEffect(() => {
    const val = new URLSearchParams(window.location.search).get("q") || "";
    if (val !== value) setValue(val);
  }, [search]);

  const {
    suggestions,
    onKeyDown,
    getSuggestions,
    selectionIndex,
    afterApplySelection,
    displayToValueMap,
    caret,
    searching,
    loadingSuggestionsValues,
    cleanValue,
  } = useSuggestions(
    schema,
    inputRef,
    setValue,
    JSON.parse(new URLSearchParams(window.location.search).get("map") || "{}")
  );

  // When value change, set it to url querystring ?q=
  useEffect(() => {
    if (!loadingCustomFields) {
      const url = new URL(window.location.href);
      url.searchParams.set("q", value);
      url.searchParams.set("map", JSON.stringify(displayToValueMap));
      window.history.replaceState({}, "", url.toString());
      delayCall(
        () => {
          onChange(
            generateQuery(fields, extractFilters(value), displayToValueMap)
          );
        },
        {
          key: "search-bar",
          timeout: debounce,
        }
      );
    }
  }, [value, loadingCustomFields, JSON.stringify(fields)]);

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
    <div
      className={twMerge(
        "grow relative w-full group rounded z-10 pl-1 pr-3 flex items-center space-x-2 transition-all",
        className,
        suggestions.length > 0 && "shadow-lg"
      )}
    >
      <div className="grow relative">
        <div
          ref={rendererRef}
          style={{
            zIndex: -1,
            lineHeight: "1.8",
          }}
          className={twMerge(
            "break-all",
            "translate-y-px pointer-events-none select-none absolute w-full h-max left-0 top-0 text-base px-3 py-1.5",
            value && "font-mono",
            "pl-9"
          )}
        >
          {extractFilters(value).map((filter, i) => {
            return <Fragment key={i}>{buildFilter(fields, filter)}</Fragment>;
          })}
        </div>
        <InputDecorationIcon
          prefix={() => (
            <Button
              data-tooltip="Filtrer"
              className={"absolute left-1.5 top-1.5"}
              size="xs"
              theme="invisible"
              icon={(p) => <FunnelIcon {...p} />}
            />
          )}
          input={({ className }) => (
            <Input
              disabled={loadingCustomFields}
              shortcut={["cmd+shift+f"]}
              onMouseUp={getSuggestions}
              onKeyUp={getSuggestions}
              onKeyDown={onKeyDown}
              onBlur={() => cleanValue()}
              style={{ resize: "none", lineHeight: "1.8" }}
              placeholder="Recherche globale, tags:factures, updated_at:2024-01-01..."
              inputRef={inputRef}
              spellCheck={false}
              multiline
              className={twMerge(
                "break-all !border-none !shadow-none !ring-0",
                "z-10 !bg-transparent !dark:bg-transparent !text-transparent !dark:text-transparent caret-black dark:caret-white w-full py-1.5",
                suggestions.length > 0 && "focus:rounded-b-none",
                value && "font-mono",
                className,
                "pl-9"
              )}
              value={value}
              onChange={(e) =>
                setValue(
                  e.target.value
                    ?.replace(/\n/g, "")
                    .replace(/ +/g, " ")
                    .replace(/^ +/, "") || ""
                )
              }
            />
          )}
        />
      </div>
      <Button
        className="shrink-0"
        size="xs"
        theme="invisible"
        icon={(p) => <ChevronUpDownIcon {...p} />}
      >
        Affichage
      </Button>
      <Button
        className="shrink-0"
        size="xs"
        theme="invisible"
        icon={(p) => <ArrowDownTrayIcon {...p} />}
      >
        Export
      </Button>
      {suffix}
      {suggestions.length > 0 && (
        <div className="hidden group-focus-within:block hover:block text-base z-10 absolute right-0 top-full w-full h-max shadow-lg flex items-center bg-white dark:bg-wood-990 border-t rounded rounded-t-none px-2 py-1">
          <SearchBarSuggestions
            suggestions={suggestions}
            selected={selectionIndex}
            afterOnClick={afterApplySelection}
            caret={caret}
            searching={searching}
            schema={schema}
            loadingSuggestionsValues={loadingSuggestionsValues}
          />
        </div>
      )}
    </div>
  );
};
