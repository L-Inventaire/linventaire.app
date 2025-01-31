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
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { FunnelIcon as FunnelIconSolid } from "@heroicons/react/24/solid";
import { Fragment, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import { Suggestions, useSuggestions } from "./hooks/use-suggestions";
import { SearchBarSuggestions } from "./suggestions";
import { buildFilter } from "./utils/filter";
import { OutputQuery, SearchField } from "./utils/types";
import { getFromUrl, setToUrl } from "./utils/url";
import { extractFilters, generateQuery } from "./utils/utils";
import { Popover } from "@radix-ui/themes";

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
  const fields = schema.fields.filter((a) => a.label);

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
          const filters = generateQuery(
            fields,
            extractFilters(value),
            displayToValueMap
          );
          onChange(filters, value);
        },
        {
          key: "search-bar",
          timeout: debounce,
        }
      );
    }
  }, [value, loadingCustomFields, fields.length]);

  // When value change, set inputHeight to rendererRef height
  useEffect(() => {
    if (rendererRef.current && inputRef.current) {
      inputRef.current.style.height = `${Math.max(
        37,
        rendererRef.current.scrollHeight + 2
      )}px`;
    }
  }, [value]);

  const [_filtersEnabled, setFiltersEnabled] = useState(false);
  const filtersEnabled = inlineSuggestions ? true : _filtersEnabled;

  const searchBarParent = useRef<HTMLDivElement>(null);
  const [focusIn, setFocusIn] = useState(false);
  useEffect(() => {
    // Detect any click on the window, if it's in the search bar, set focusIn to true
    const listener = (e: MouseEvent) => {
      if (searchBarParent.current?.contains(e.target as Node)) {
        setFocusIn(true);
      } else {
        setFocusIn(false);
      }
    };
    window.addEventListener("click", listener);
    return () => window.removeEventListener("click", listener);
  }, []);

  return (
    <div
      ref={searchBarParent}
      className={twMerge(
        "grow relative w-full group rounded z-10 transition-all flex-col text-black dark:text-white",
        !inlineSuggestions && filtersEnabled && "focus-within:shadow-lg",
        className
      )}
      style={{ maxHeight: "inherit" }}
    >
      <div
        className={twMerge(
          "pl-1 pr-3 flex items-center space-x-2 py-2 h-12",
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
                      shortcut={["cmd+shift+f"]}
                      data-tooltip={
                        !inlineSuggestions
                          ? "Activer les filtres avancés "
                          : "Les filtres ne peuvent pas être désactivés"
                      }
                      className={twMerge(
                        "!absolute !left-1 !top-0 !bottom-0 !m-auto",
                        filtersEnabled && !inlineSuggestions
                          ? "text-blue-500"
                          : "text-gray-500"
                      )}
                      size="sm"
                      theme="invisible"
                      icon={(p) =>
                        inlineSuggestions ? (
                          <MagnifyingGlassIcon {...p} />
                        ) : !filtersEnabled ? (
                          <FunnelIcon {...p} />
                        ) : (
                          <FunnelIconSolid {...p} />
                        )
                      }
                      onClick={(e) => {
                        inputRef.current?.focus();
                        // Keyboard set it to true everytime
                        setFiltersEnabled(
                          e?.type === "click" ? !filtersEnabled : true
                        );
                        e.preventDefault();
                        e.stopPropagation();
                        setFocusIn(true);
                      }}
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
                  placeholder ||
                  (filtersEnabled
                    ? `Chercher des filtres ou des éléments ${showShortCut([
                        "cmd+f",
                      ])}`
                    : `Filtrer les éléments ${showShortCut([
                        "cmd+f",
                      ])} (recherche avancée ${showShortCut(["cmd+shift+f"])})`)
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
                onChange={(e) => {
                  setValue(
                    e.target.value
                      ?.replace(/\n/g, "")
                      .replace(/ +/g, " ")
                      .replace(/^ +/, "") || ""
                  );
                }}
              />
            )}
          />
        </div>
        {fields.length > 0 && (
          <Popover.Root>
            <Popover.Trigger>
              <Button
                className="shrink-0 hidden md:flex"
                size="sm"
                theme="invisible"
                icon={(p) => <ChevronUpDownIcon {...p} />}
              >
                Affichage
              </Button>
            </Popover.Trigger>
            <Popover.Content width="360px">
              <div>Couidou</div>
            </Popover.Content>
          </Popover.Root>
        )}
        {showExport !== false &&
          false &&
          document.location.host.indexOf("localhost") > -1 && (
            <Button
              className="shrink-0 hidden md:flex"
              size="sm"
              theme="invisible"
              icon={(p) => <ArrowDownTrayIcon {...p} />}
            >
              Export
            </Button>
          )}
        {suffix}
      </div>
      {suggestions.length > 0 &&
        (focusIn || inlineSuggestions) &&
        filtersEnabled && (
          <div
            className={twMerge(
              "hidden hover:block text-base z-10 top-full h-max flex items-center bg-white dark:bg-slate-990 dark:border-slate-700 border-t rounded rounded-t-none px-2 py-1",
              inlineSuggestions
                ? "grow relative block overflow-visible shrink-0 w-full right-0"
                : "group-focus-within:block absolute shadow-lg left-8 right-8"
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
                setValue={setValue}
              />
              {afterSuggestions}
            </DefaultScrollbars>
          </div>
        )}
    </div>
  );
};
