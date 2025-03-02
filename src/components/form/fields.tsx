import { Button } from "@atoms/button/button";
import SelectBoolean from "@atoms/input/input-boolean-select";
import { Checkbox } from "@atoms/input/input-checkbox";
import InputColor from "@atoms/input/input-color";
import InputDate from "@atoms/input/input-date";
import { InputDecorationIcon } from "@atoms/input/input-decoration-icon";
import { InputLabel } from "@atoms/input/input-decoration-label";
import { InputFormat } from "@atoms/input/input-format";
import InputPhone from "@atoms/input/input-phone";
import Select from "@atoms/input/input-select";
import SelectMultiple from "@atoms/input/input-select-multiple";
import Radio from "@atoms/input/input-select-radio";
import { Input } from "@atoms/input/input-text";
import InputTime from "@atoms/input/input-time";
import { InputWithSuggestions } from "@atoms/input/input-with-suggestion";
import { UsersInput } from "@components/deprecated-users-input";
import { RestDocumentsInput } from "@components/input-rest";
import { FilesInput } from "@components/input-rest/files";
import { TagsInput } from "@components/input-rest/tags";
import { debounce } from "@features/utils/debounce";
import {
  timeBase60ToDecimal,
  timeDecimalToBase60,
} from "@features/utils/format/dates";
import { useControlledEffect } from "@features/utils/hooks/use-controlled-effect";
import {
  ArrowsPointingOutIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import _ from "lodash";
import { nanoid } from "nanoid";
import { memo, SVGProps, useContext, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { FormContextContext, FormControllerType } from "./formcontext";
import { FormReadonly } from "./readonly";
import { SearchFormFieldType } from "./types";

export type ResetProps = Omit<SVGProps<SVGSVGElement>, "ref">;

export const FormInput = memo(
  (
    props: Omit<SearchFormFieldType, "key"> & {
      className?: string;
      inputClassName?: string;
      highlight?: boolean;
      main?: boolean;
      size?: "md" | "sm" | "lg";
      readonly?: boolean;
      ctrl?: FormControllerType<any>;
      value?:
        | string
        | boolean
        | number
        | Date
        | string[]
        | { label: string; value: string };
      onReset?: () => void;
      onChange?: (value: any, object?: any) => void;
      onEnter?: (value: any) => void;
      onSearch?: () => void;
      disabled?: boolean;
      values?: any;
      autoFocus?: "scan" | "keyboard" | boolean;
      autoSelect?: boolean;
      autoSelectAll?: boolean; // Will select all the content on focus
      // Radio Input
      layout?: "horizontal" | "vertical";
      metadata?: {
        [key: string]: any;
      };
      autoComplete?: string;
    }
  ) => {
    const formContext = useContext(FormContextContext);

    const readonly = props.readonly ?? formContext.readonly;
    const alwaysVisible = props.alwaysVisible ?? formContext.alwaysVisible;
    const size = props.size || formContext.size || "md";
    const highlight = props.highlight || formContext.highlight || false;
    const placeholder = props.placeholder || props.label || "";
    const disabled = props.disabled || formContext.disabled || false;
    const _value = props.ctrl?.value || props.value;
    const _onChange = props.ctrl?.onChange || props.onChange;

    const fieldId = useRef(nanoid());
    const [optionsLoading, setOptionsLoading] = useState(false);
    const [options, setOptions] = useState<
      { label: string; value: string; disabled?: boolean }[]
    >(typeof props.options === "function" ? [] : props.options || []);

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
      () => suggest(typeof _value === "string" ? _value : ""),
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
      suggestionQuery?: string,
      objects?: any
    ) => {
      if (suggestionQuery && typeof props.options === "function") {
        suggest(suggestionQuery || (value as string));
      }
      _onChange?.(value, objects);
    };

    if (
      props.main &&
      (!props.type ||
        props.type === "text" ||
        props.type === "scan" ||
        props.type === "password")
    ) {
      return (
        <div
          className={twMerge(
            "flex flex-row w-full max-w-xl grow items-center",
            props.className || ""
          )}
        >
          <InputWithSuggestions
            autoFocus={props.autoFocus}
            inputClassName={twMerge(
              props.inputClassName,
              props.type === "scan" ? "to-focus" : ""
            )}
            options={options}
            loading={optionsLoading}
            highlight={highlight}
            size="md"
            placeholder={placeholder}
            value={(_value as string) || ""}
            onChange={(e) => onChange(e.target.value, e.target.value)}
            onKeyUp={(e) => {
              if (e.key === "Enter") props.onSearch?.();
            }}
            disabled={disabled}
            type={props.type === "password" ? "password" : "text"}
            autoComplete={props.autoComplete}
          />
          <Button onClick={props.onSearch} size="md" shortcut={["enter"]}>
            <MagnifyingGlassIcon className="h-6 w-6 -mx-2" />
          </Button>
        </div>
      );
    }

    if (readonly) {
      return (
        <div className={twMerge("w-full", props.className || "")}>
          <FormReadonly
            {...props}
            alwaysVisible={alwaysVisible}
            type={props.type}
            value={_value || ""}
            size={size || "md"}
            values={props.values}
          />
        </div>
      );
    }

    return (
      <InputLabel
        className={twMerge("w-full", props.className || "")}
        onReset={props.onReset}
        label={props.label}
        input={
          <>
            {(!props.type ||
              props.type === "text" ||
              props.type === "scan" ||
              props.type === "password") && (
              <InputWithSuggestions
                className="w-full"
                autoFocus={props.autoFocus}
                autoSelect={props.autoSelect}
                autoSelectAll={props.autoSelectAll}
                inputClassName={twMerge(
                  props.inputClassName,
                  props.type === "scan" && "to-focus"
                )}
                style={{ minWidth: 128 }}
                options={options}
                loading={optionsLoading}
                highlight={highlight}
                value={(_value as string) || ""}
                onChange={(e) => onChange(e.target.value, e.target.value)}
                onKeyUp={(e: any) => {
                  if (props.onEnter && e.key === "Enter")
                    props.onEnter?.(e.target.value);
                  else if (e.key === "Enter") props.onSearch?.();
                }}
                size={size}
                placeholder={placeholder}
                disabled={disabled}
                type={props.type === "password" ? "password" : "text"}
                autoComplete={props.autoComplete}
              />
            )}
            {props.type === "quantity" && props.metadata?.unit === "h" && (
              <InputTime
                className={twMerge(props.inputClassName)}
                onChange={(_, number) => {
                  const quantity = timeBase60ToDecimal(number);
                  onChange(quantity);
                }}
                onKeyUp={(e) => {
                  if (e.key === "Enter") props.onSearch?.();
                }}
                value={timeDecimalToBase60(_value)}
              />
            )}
            {props.type === "tags" && (
              <TagsInput
                value={(_value as string[]) || []}
                onChange={(e) => onChange(e)}
                disabled={disabled}
              />
            )}
            {props.type === "users" && (
              <UsersInput
                className="w-full"
                value={(_value as string[]) || []}
                onChange={(e) => onChange(e)}
                disabled={disabled}
              />
            )}
            {props.type === "files" && (
              <FilesInput
                className="w-full"
                value={(_value as string[]) || []}
                onChange={(e) => onChange(e)}
                disabled={disabled}
                max={props.max}
                rel={{
                  table: props.rest?.table || "",
                  field: props.rest?.column || "",
                  id: props.rest?.id || "",
                }}
              />
            )}
            {props.type === "rest_documents" && (
              <RestDocumentsInput
                label={props.label}
                value={
                  (_value as string[] | string | null) ||
                  ((props.max || 0) > 1 ? ([] as any) : null)
                }
                max={props.max}
                onChange={(id: any, object: any) =>
                  onChange(id, undefined, object)
                }
                disabled={disabled}
                entity={props.rest?.table || ""}
                filter={(props.rest?.filter || {}) as any}
              />
            )}
            {props.type === "formatted" && (
              <InputFormat
                autoFocus={!!props.autoFocus}
                autoSelectAll={props.autoSelectAll}
                autoSelect={props.autoSelect}
                className="w-full"
                style={{ minWidth: 128 }}
                format={props.format || "price"}
                highlight={highlight}
                value={(_value as string) || ""}
                onChange={(e) => onChange(e.target.value)}
                onKeyUp={(e) => {
                  if (e.key === "Enter") props.onSearch?.();
                }}
                size={size}
                placeholder={placeholder}
                disabled={disabled}
              />
            )}
            {props.type === "color" && (
              <InputColor
                value={(_value as string) || ""}
                onChange={(e) => onChange(e)}
                size={size}
                disabled={disabled}
              />
            )}
            {props.type === "phone" && (
              <InputPhone
                value={(_value as string) || ""}
                onChange={(e) => onChange(e || "")}
                size={size}
                disabled={disabled}
              />
            )}
            {(props.type === "number" ||
              (props.type === "quantity" && props.metadata?.unit !== "h")) && (
              <Input
                autoFocus={!!props.autoFocus}
                autoSelect={props.autoSelect}
                autoSelectAll={props.autoSelectAll}
                className="w-full"
                highlight={highlight}
                value={_value as number}
                onChange={(e) => onChange(e.target.value)}
                onKeyUp={(e) => {
                  if (e.key === "Enter") props.onSearch?.();
                }}
                size={size}
                type="number"
                placeholder={placeholder}
                disabled={disabled}
                min={props.min}
                max={props.max}
                step={props.step}
                onBlur={(e) => {
                  if (e.target.value) {
                    onChange(
                      Math.min(
                        props.max ?? Number.POSITIVE_INFINITY,
                        Math.max(
                          props.min ?? Number.NEGATIVE_INFINITY,
                          parseFloat(e.target.value)
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
                value={_value ? new Date(_value as string | number) : null}
                onChange={(e) => onChange(e)}
                onKeyUp={(e) => {
                  if (e.key === "Enter") props.onSearch?.();
                }}
                placeholder={placeholder}
                size={size}
                disabled={disabled}
              />
            )}
            {props.type === "boolean" && (
              <div className={"overflow-hidden flex items-center h-9"}>
                <Checkbox
                  value={(_value as boolean) || false}
                  onChange={(e) => onChange(e)}
                  label={placeholder}
                  disabled={disabled}
                />
              </div>
            )}
            {props.type === "multiselect" && (
              <SelectMultiple
                className="w-full"
                highlight={highlight}
                value={_value || []}
                onChange={(e) => onChange(e)}
                onSearch={(e) => suggest(e)}
                size={size}
                options={options || []}
                disabled={disabled}
                selectionLimit={props.max}
              />
            )}
            {props.type === "searchselect" && (
              <SelectMultiple
                className="w-full"
                highlight={highlight}
                value={_value || []}
                onChange={(e) => onChange(e)}
                onSearch={(e) => suggest(e)}
                size={size}
                placeholder={placeholder}
                options={options || []}
                disabled={disabled}
                selectionLimit={1}
              />
            )}
            {props.type === "select" && (
              <Select
                className="w-full"
                highlight={highlight}
                value={(_value as string) || ""}
                onChange={(e) => onChange(e.target.value)}
                size={size}
                placeholder={placeholder}
                disabled={disabled}
              >
                <option value="" disabled>
                  {placeholder || "-"}
                </option>
                {(options || []).map((el) => {
                  return (
                    <option
                      key={el.value}
                      value={el.value}
                      disabled={el.disabled}
                    >
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
                value={_value as boolean}
                onChange={(e) => onChange(e)}
                size={size}
                placeholder={placeholder}
                disabled={disabled}
              />
            )}
            {props.type === "radio" && (
              <Radio
                className={twMerge("w-full", props.className || "")}
                highlight={highlight}
                value={_value as string}
                onChange={(e) => onChange(e)}
                size={size}
                placeholder={placeholder}
                disabled={disabled}
                options={options || []}
                layout={props.layout || "horizontal"}
              />
            )}
            {props.type === "modal" && (
              <InputDecorationIcon
                suffix={(p) => <ArrowsPointingOutIcon {...p} />}
                onClick={() => {
                  if (disabled) return;
                  props.onClick &&
                    props.onClick({ readonly: false, values: props.values });
                }}
                className="cursor-pointer"
                input={({ className }) => (
                  <Input
                    className={className + " pointer-events-none"}
                    highlight={highlight}
                    value={
                      (props.render?.(_value, props.values) as string) ||
                      (_value as string)
                    }
                    onChange={() => {}}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      (e.target as HTMLInputElement).blur();
                    }}
                    size={size}
                    placeholder={placeholder}
                    disabled={disabled}
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
