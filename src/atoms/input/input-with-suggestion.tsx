import { Loader } from "@atoms/loader";
import { BaseSmall } from "@atoms/text";
import { applySearchFilter } from "@features/utils/format/strings";
import _ from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";
import { Input, InputProps } from "./input-text";

// ... (existing imports)

type InputSuggestionProps = {
  options: { label: string; value: string }[];
  loading?: boolean;
  autoFocus?: "scan" | "keyboard" | boolean;
} & Omit<InputProps, "autoFocus">;

export const InputWithSuggestions = (props: InputSuggestionProps) => {
  const [focus, setFocus] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const value = typeof props.value === "string" ? props.value : "";
  const ref = useRef<HTMLInputElement>(null);

  const filteredOptions = _.uniqBy(
    props.options.filter(
      (e) =>
        applySearchFilter(value, e.label) || applySearchFilter(value, e.value)
    ),
    "value"
  ).filter((e) => e.label?.trim() && e.value?.trim());

  const onKeyDown = (e: any) => {
    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prevIndex) => Math.max(prevIndex - 1, -1));
        break;
      case "ArrowDown":
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prevIndex) =>
          Math.min(prevIndex + 1, filteredOptions.length - 1)
        );
        break;
      case "Enter":
        if (selectedIndex >= 0 && selectedIndex < filteredOptions.length) {
          props.onChange &&
            props.onChange({
              target: { value: filteredOptions[selectedIndex].value },
            } as any);
          setFocus(false);
        }
        break;
      default:
        break;
    }
  };

  const event = useCallback((event: KeyboardEvent) => {
    if (
      event.key?.match(/^[A-Za-z0-9]$/i) &&
      !event.shiftKey &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      !document.activeElement?.tagName?.match(/input|textarea|select/i)
    ) {
      ref.current?.focus();
    }
  }, []);

  useEffect(() => {
    if (props.autoFocus === true || props.autoFocus === "keyboard") {
      window.addEventListener("keydown", event);
    }
    return () => window.removeEventListener("keydown", event);
  }, [event, props.autoFocus]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [value]);

  return (
    <div className={"relative w-full "}>
      <Input
        inputRef={ref}
        autoFocus={props.autoFocus === "keyboard" || props.autoFocus === true}
        {..._.omit(props, "options", "loading", "autoFocus")}
        onFocus={(e) => {
          setFocus(true);
          props.onFocus && props.onFocus(e as any);
        }}
        onBlur={(e) => {
          setFocus(false);
          props.onBlur && props.onBlur(e as any);
        }}
        onKeyDown={(e) => onKeyDown(e)}
      />
      {props.loading && (
        <div className="absolute top-1/2 right-2 transform -translate-y-1/2 h-full flex items-center">
          <Loader />
        </div>
      )}
      {focus && !!filteredOptions?.length && value.length > 0 && (
        <div className="absolute z-10 top-full left-0 w-full bg-white shadow-md max-h-lg overflow-auto dark:bg-slate-800">
          {_.uniqBy(filteredOptions, "value").map((e: any, index: number) => (
            <div
              key={index}
              className={`py-1 px-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-500 ${
                selectedIndex === index ? "bg-gray-200" : ""
              }`}
              onMouseDown={() => {
                props.onChange &&
                  props.onChange({ target: { value: e.value } } as any);
                setFocus(false);
              }}
            >
              <BaseSmall>{e.label}</BaseSmall>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
