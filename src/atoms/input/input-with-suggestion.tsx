import { Loader } from "@atoms/loader";
import { BaseSmall } from "@atoms/text";
import { applySearchFilter } from "@features/utils/format/strings";
import _ from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";
import { Input, InputProps } from "./input-text";
import { twMerge } from "tailwind-merge";

// ... (existing imports)

type InputSuggestionProps = {
  wrapperClassName?: string;
  onSelect?: (value: string) => void;
  options: { label: string; value: string }[];
  loading?: boolean;
  autoFocus?: "scan" | "keyboard" | boolean;
  autoSelect?: boolean;
  render?: (e: { label: string; value: string }) => React.ReactNode;
  float?: boolean;
} & Omit<InputProps, "autoFocus" | "onSelect">;

export const InputWithSuggestions = (props: InputSuggestionProps) => {
  const [value, setValue] = useState<string>((props.value as string) || "");
  const [focus, setFocus] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const ref = useRef<HTMLInputElement>(null);
  const float = props.float !== false;

  useEffect(() => {
    setValue((props.value as string) || "");
  }, [props.value]);

  useEffect(() => {
    props.onChange?.({ target: { value } } as any);
  }, [value]);

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
        if (
          selectedIndex < filteredOptions.length &&
          filteredOptions.length &&
          ref.current?.matches(":focus")
        ) {
          const i = Math.max(selectedIndex, 0);
          props.onSelect && props.onSelect(filteredOptions[i].value);
          props.onChange &&
            props.onChange({
              target: { value: filteredOptions[i].value },
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
    <div
      className={twMerge(
        "relative w-full min-w-16",
        props.wrapperClassName,
        focus && float && "box-shadow-lg dark:box-shadow-none"
      )}
    >
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        inputRef={ref}
        autoSelect={props.autoSelect}
        autoFocus={props.autoFocus === "keyboard" || props.autoFocus === true}
        {..._.omit(
          props,
          "options",
          "loading",
          "autoFocus",
          "onChange",
          "value",
          "wrapperClassName",
          "onSelect"
        )}
        onFocus={(e) => {
          setFocus(true);
          props.onFocus && props.onFocus(e as any);
        }}
        onBlur={(e) => {
          setFocus(false);
          props.onBlur && props.onBlur(e as any);
        }}
        onKeyDown={(e) => {
          onKeyDown(e);
          setFocus(true);
        }}
        className={focus && !!filteredOptions?.length ? "rounded-b-none" : ""}
      />
      {props.loading && (
        <div className="absolute top-1/2 right-2 transform -translate-y-1/2 h-full flex items-center">
          <Loader />
        </div>
      )}
      {focus && !!filteredOptions?.length && (
        <div className="absolute z-10 top-full left-0 w-full bg-white shadow-md max-h-lg overflow-auto dark:bg-slate-950 border ring-1 border-slate-500 ring-slate-500 rounded-b-md border-t-none">
          {_.uniqBy(filteredOptions, "value").map((e: any, index: number) => (
            <div
              key={index}
              className={`py-1 px-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-500 ${
                selectedIndex === index ? "bg-gray-200" : ""
              }`}
              onMouseDown={() => {
                props.onSelect && props.onSelect(e.value);
                props.onChange &&
                  props.onChange({ target: { value: e.value } } as any);
                setFocus(false);
              }}
            >
              <BaseSmall>{props.render?.(e) || e.label}</BaseSmall>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
