import { Input } from "@atoms/input/input-text";
import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { buildFilter } from "./filter";
import { OutputQuery, SearchField } from "./types";
import { extractFilters, generateQuery } from "./utils";
import { debounce as delayCall } from "@features/utils/debounce";

export const SearchBar = ({
  fields,
  onChange,
  debounce = 300,
}: {
  fields: SearchField[];
  onChange: (str: OutputQuery) => void;
  debounce?: number;
}) => {
  const [value, setValue] = useState(
    new URLSearchParams(window.location.search).get("q") || ""
  );
  const rendererRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // When value change, set it to url querystring ?q=
  useEffect(() => {
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
        39,
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
          "pointer-events-none select-none absolute w-full h-max left-0 top-0 text-sm px-3 py-2 border border-transparent",
          value && "font-mono"
        )}
      >
        {extractFilters(value).map((filter) => {
          return buildFilter(fields, filter);
        })}
      </div>
      <Input
        style={{ resize: "none", lineHeight: "1.5" }}
        placeholder="Rechercher dans tous les champs..."
        inputRef={inputRef}
        spellCheck={false}
        multiline
        className={twMerge(
          "break-all",
          "z-10 !bg-transparent !dark:bg-transparent !text-transparent !dark:text-transparent caret-black dark:caret-white w-full focus:rounded-b-none",
          value && "font-mono"
        )}
        value={value}
        onChange={(e) =>
          setValue(e.target.value?.replace(/\n/g, "").replace(/ +/g, " ") || "")
        }
      />
      {false && (
        <div className="hidden group-focus-within:block text-sm z-10 absolute right-0 top-full w-full h-max shadow-md flex items-center pr-2 bg-white dark:bg-wood-990 ring-1 ring-wood-500 border border-wood-500 rounded rounded-t-none p-4">
          Yo
          <br />
          And more
        </div>
      )}
    </div>
  );
};
