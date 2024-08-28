import { Button } from "@atoms/button/button";
import { InputDecorationIcon } from "@atoms/input/input-decoration-icon";
import { Input } from "@atoms/input/input-text";
import { useTableFields } from "@features/fields/hooks/use-fields";
import { debounce as delayCall } from "@features/utils/debounce";
import { normalizeString } from "@features/utils/format/strings";
import { DefaultScrollbars } from "@features/utils/scrollbars";
import { Shortcut, showShortCut } from "@features/utils/shortcuts";
import {
  ArrowDownTrayIcon,
  ChevronUpDownIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { Fragment, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import { Suggestions, useSuggestions } from "./hooks/use-suggestions";
import { SearchBarSuggestions } from "./suggestions";
import { buildFilter } from "./utils/filter";
import { OutputQuery, SearchField } from "./utils/types";
import { getFromUrl, setToUrl } from "./utils/url";
import { extractFilters, generateQuery } from "./utils/utils";

export const SearchBar = ({
  schema,
  value: controlledValue,
  onChange,
  debounce = 300,
  suggestions: additionalSuggestions,
  className,
  inputClassName,
  suffix,
  showExport,
  placeholder,
  autoFocus,
  inlineSuggestions,
  shortcuts,
  urlSync,
  afterSuggestions,
}: {
  schema: { table: string; fields: SearchField[] };
  value?: string;
  onChange: (str: OutputQuery, raw: string) => void;
  debounce?: number;
  suggestions?: Suggestions;
  className?: string;
  inputClassName?: string;
  suffix?: JSX.Element;
  showExport?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  inlineSuggestions?: boolean;
  shortcuts?: Shortcut[];
  urlSync?: boolean;
  afterSuggestions?: JSX.Element;
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
    urlSync !== false ? getFromUrl(schema.fields) : ""
  );
  const rendererRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (controlledValue !== undefined) setValue(controlledValue);
  }, [controlledValue]);

  const { search } = useLocation();
  useEffect(() => {
    if (urlSync !== false) {
      const val = getFromUrl(schema.fields);
      if (val !== value) setValue(val);
    }
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
    JSON.parse(new URLSearchParams(window.location.search).get("map") || "{}"),
    additionalSuggestions
  );

  // When value change, set it to url querystring ?q=
  useEffect(() => {
    if (!loadingCustomFields) {
      if (urlSync !== false) {
        const url = new URL(window.location.href);
        setToUrl(url, value, schema.fields);
        url.searchParams.set("map", JSON.stringify(displayToValueMap));
        window.history.replaceState({}, "", url.toString());
      }
      delayCall(
        () => {
          onChange(
            generateQuery(fields, extractFilters(value), displayToValueMap),
            value
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
        37,
        rendererRef.current.scrollHeight + 2
      )}px`;
    }
  }, [value]);

  return (
    <div
      className={twMerge(
        "grow relative w-full group rounded z-10 transition-all flex-col text-black dark:text-white",
        !inlineSuggestions && "focus-within:shadow-lg",
        className
      )}
      style={{ maxHeight: "inherit" }}
    >
      <div
        className={twMerge(
          "pl-1 pr-3 flex items-center space-x-2 py-2",
          inputClassName
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
              fields.length === 0 ? "pl-4" : "pl-9"
            )}
          >
            {extractFilters(value).map((filter, i) => {
              return <Fragment key={i}>{buildFilter(fields, filter)}</Fragment>;
            })}
          </div>
          <InputDecorationIcon
            prefix={
              fields.length === 0
                ? undefined
                : () => (
                    <Button
                      data-tooltip="Filtrer"
                      className={"absolute left-1.5 top-1.5"}
                      size="sm"
                      theme="invisible"
                      icon={(p) => <FunnelIcon {...p} />}
                    />
                  )
            }
            input={({ className }) => (
              <Input
                data-release-escape
                autoFocus={autoFocus}
                disabled={loadingCustomFields}
                shortcut={shortcuts || ["cmd+f"]}
                onMouseUp={getSuggestions}
                onKeyUp={getSuggestions}
                onKeyDown={onKeyDown}
                onBlur={() => cleanValue()}
                style={{ resize: "none", lineHeight: !value ? "1.9" : "1.8" }}
                placeholder={
                  placeholder || "Filtrer " + showShortCut(["cmd+f"])
                }
                inputRef={inputRef}
                spellCheck={false}
                multiline
                className={twMerge(
                  "break-all !border-none !shadow-none !ring-0",
                  "z-10 !bg-transparent !dark:bg-transparent !text-transparent !dark:text-transparent caret-black dark:caret-white w-full py-1.5",
                  suggestions.length > 0 && "focus:rounded-b-none",
                  value && "font-mono",
                  className,
                  fields.length === 0 ? "pl-4" : "pl-9"
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
        {fields.length > 0 &&
          document.location.host.indexOf("localhost") > -1 && (
            <Button
              className="shrink-0"
              size="sm"
              theme="invisible"
              icon={(p) => <ChevronUpDownIcon {...p} />}
            >
              Affichage
            </Button>
          )}
        {showExport !== false &&
          document.location.host.indexOf("localhost") > -1 && (
            <Button
              className="shrink-0"
              size="sm"
              theme="invisible"
              icon={(p) => <ArrowDownTrayIcon {...p} />}
            >
              Export
            </Button>
          )}
        {suffix}
      </div>
      {suggestions.length > 0 && (
        <div
          className={twMerge(
            "hidden hover:block text-base z-10 right-0 top-full w-full h-max flex items-center bg-white dark:bg-slate-990 dark:border-slate-700 border-t rounded rounded-t-none px-2 py-1",
            inlineSuggestions
              ? "grow relative block overflow-visible shrink-0"
              : "group-focus-within:block absolute shadow-lg"
          )}
        >
          <DefaultScrollbars
            className="block shrink-0 h-max"
            autoHeight
            autoHeightMax={"50vh"}
          >
            <SearchBarSuggestions
              suggestions={suggestions}
              selected={selectionIndex}
              afterOnClick={afterApplySelection}
              caret={caret}
              searching={searching}
              schema={schema}
              loadingSuggestionsValues={loadingSuggestionsValues}
            />
            {afterSuggestions}
          </DefaultScrollbars>
        </div>
      )}
    </div>
  );
};
