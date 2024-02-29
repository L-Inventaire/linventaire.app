import { Button } from "@atoms/button/button";
import SelectBoolean from "@atoms/input/input-boolean-select";
import { Checkbox } from "@atoms/input/input-checkbox";
import InputDate from "@atoms/input/input-date";
import { InputFormat } from "@atoms/input/input-format";
import SelectMultiple from "@atoms/input/input-select-multiple";
import { Input } from "@atoms/input/input-text";
import { InputWithSuggestions } from "@atoms/input/input-with-suggestion";
import Select from "@atoms/input/input-select";
import { debounce } from "@features/utils/debounce";
import { useControlledEffect } from "@features/utils/hooks/use-controlled-effect";
import { ArrowsExpandIcon, SearchIcon } from "@heroicons/react/outline";
import { nanoid } from "nanoid";
import { memo, useRef, useState } from "react";
import { SearchFormFieldType } from "./types";
import _ from "lodash";
import { InputLabel } from "@atoms/input/input-decoration-label";
import { InputDecorationIcon } from "@atoms/input/input-decoration-icon";

export const FormInput = memo(
  (
    props: Omit<SearchFormFieldType, "key"> & {
      highlight?: boolean;
      main?: boolean;
      size: "md" | "lg";
      value:
        | string
        | boolean
        | number
        | Date
        | string[]
        | { label: string; value: string };
      onChange: (value: any) => void;
      onSearch?: () => void;
      disabled?: boolean;
      values: any;
      autoFocus?: "scan" | "keyboard" | boolean;
    }
  ) => {
    const fieldId = useRef(nanoid());
    const highlight = props.highlight || false;
    const [optionsLoading, setOptionsLoading] = useState(false);
    const [options, setOptions] = useState<{ label: string; value: string }[]>(
      typeof props.options === "function" ? [] : props.options || []
    );

    const suggest = (query: string) => {
      if (typeof props.options === "function") {
        setOptionsLoading(true);
        debounce(
          async () => {
            setOptionsLoading(true);
            try {
              if (typeof props.options === "function") {
                const res = await props.options(query);
                const filteredOptions = _.uniqBy(res, "value").filter(
                  (e) => e.label?.trim() && e.value?.trim()
                );
                setOptions(filteredOptions);
              }
            } catch (e) {
              console.error(e);
            } finally {
              setOptionsLoading(false);
            }
          },
          {
            timeout: 500,
            key: `filters-suggest-${fieldId.current}`,
          }
        );
      }
    };

    useControlledEffect(
      () => suggest(typeof props.value === "string" ? props.value : ""),
      []
    );

    const onChange = (
      value:
        | string
        | boolean
        | Date
        | number
        | string[]
        | { label: string; value: string }[]
        | null,
      suggestionQuery?: string
    ) => {
      if (suggestionQuery && typeof props.options === "function") {
        suggest(suggestionQuery || (value as string));
      }
      props.onChange(value);
    };

    if (props.type === "custom") {
      return (
        <>
          {(props as any).node({
            value: props.value,
            onChange: props.onChange,
          })}
        </>
      );
    }

    if (
      props.main &&
      (!props.type || props.type === "text" || props.type === "scan")
    ) {
      return (
        <div className="flex flex-row w-full max-w-xl grow items-center">
          <InputWithSuggestions
            autoFocus={props.autoFocus}
            inputClassName={props.type === "scan" ? "to-focus" : ""}
            options={options}
            loading={optionsLoading}
            highlight={highlight}
            size="lg"
            placeholder={props.placeholder}
            value={(props.value as string) || ""}
            onChange={(e) => onChange(e.target.value, e.target.value)}
            disabled={props.disabled}
          />
          <Button onClick={props.onSearch} size="lg" shortcut={["enter"]}>
            <SearchIcon className="h-6 w-6 -mx-2" />
          </Button>
        </div>
      );
    }

    return (
      <InputLabel
        className="w-full"
        label={props.label || ""}
        input={
          <>
            {(!props.type ||
              props.type === "text" ||
              props.type === "scan") && (
              <InputWithSuggestions
                className="w-full"
                autoFocus={props.autoFocus}
                inputClassName={props.type === "scan" ? "to-focus" : ""}
                style={{ minWidth: 128 }}
                options={options}
                loading={optionsLoading}
                highlight={highlight}
                value={(props.value as string) || ""}
                onChange={(e) => onChange(e.target.value, e.target.value)}
                size={props.size}
                placeholder={props.placeholder}
                disabled={props.disabled}
              />
            )}
            {props.type === "formatted" && (
              <InputFormat
                className="w-full"
                style={{ minWidth: 128 }}
                format={props.format || "price"}
                highlight={highlight}
                value={(props.value as string) || ""}
                onChange={(e) => onChange(e.target.value)}
                size={props.size}
                placeholder={props.placeholder}
                disabled={props.disabled}
              />
            )}
            {props.type === "number" && (
              <Input
                className="w-full"
                highlight={highlight}
                value={(props.value as number) || 0}
                onChange={(e) => onChange(e.target.value)}
                size={props.size}
                type="number"
                placeholder={props.placeholder}
                disabled={props.disabled}
                min={props.min}
                max={props.max}
                onBlur={(e) => {
                  if (e.target.value) {
                    onChange(
                      Math.min(
                        props.max ?? Number.POSITIVE_INFINITY,
                        Math.max(
                          props.min ?? Number.NEGATIVE_INFINITY,
                          parseInt(e.target.value)
                        )
                      )
                    );
                  }
                }}
              />
            )}
            {props.type === "date" && (
              <InputDate
                className="w-full"
                highlight={highlight}
                value={
                  props.value ? new Date(props.value as string | number) : null
                }
                onChange={(e) => onChange(e)}
                placeholder={props.placeholder}
                size={props.size}
                disabled={props.disabled}
              />
            )}
            {props.type === "boolean" && (
              <div
                className={
                  "overflow-hidden flex items-center " +
                  (props.size === "lg" ? "h-11" : "h-9")
                }
              >
                <Checkbox
                  value={(props.value as boolean) || false}
                  onChange={(e) => onChange(e)}
                  label={props.placeholder}
                  disabled={props.disabled}
                />
              </div>
            )}
            {props.type === "multiselect" && (
              <SelectMultiple
                className="w-full"
                highlight={highlight}
                value={
                  props.value
                    ? [props.value as { label: string; value: string }]
                    : []
                }
                onChange={(e) => onChange(e)}
                onSearch={(e) => suggest(e)}
                size={props.size}
                options={options || []}
                disabled={props.disabled}
                selectionLimit={props.max}
              />
            )}
            {props.type === "searchselect" && (
              <SelectMultiple
                className="w-full"
                highlight={highlight}
                value={
                  props.value
                    ? [props.value as { label: string; value: string }]
                    : []
                }
                onChange={(e) => onChange(e)}
                onSearch={(e) => suggest(e)}
                size={props.size}
                placeholder={props.placeholder}
                options={options || []}
                disabled={props.disabled}
                selectionLimit={1}
              />
            )}
            {props.type === "select" && (
              <Select
                className="w-full"
                highlight={highlight}
                value={(props.value as string) || ""}
                onChange={(e) => onChange(e.target.value)}
                size={props.size}
                placeholder={props.placeholder}
                disabled={props.disabled}
              >
                <option value="">{props.placeholder || "-"}</option>
                {(options || []).map((el) => {
                  return (
                    <option key={el.value} value={el.value}>
                      {el.label}
                    </option>
                  );
                })}
              </Select>
            )}
            {props.type === "select_boolean" && (
              <SelectBoolean
                className="w-full"
                highlight={highlight}
                value={props.value as boolean}
                onChange={(e) => onChange(e)}
                size={props.size}
                placeholder={props.placeholder}
                disabled={props.disabled}
              />
            )}
            {props.type === "modal" && (
              <InputDecorationIcon
                suffix={(p) => <ArrowsExpandIcon {...p} />}
                onClick={() => {
                  if (props.disabled) return;
                  props.onClick &&
                    props.onClick({ readonly: false, values: props.values });
                }}
                className="cursor-pointer"
                input={({ className }) => (
                  <Input
                    className={className + " pointer-events-none"}
                    highlight={highlight}
                    value={
                      (props.render?.(props.value, props.values) as string) ||
                      (props.value as string)
                    }
                    onChange={() => {}}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      (e.target as HTMLInputElement).blur();
                    }}
                    size={props.size}
                    placeholder={props.placeholder}
                    disabled={props.disabled}
                  />
                )}
              />
            )}
          </>
        }
      />
    );
  }
);
