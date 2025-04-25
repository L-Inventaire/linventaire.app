import Multiselect from "@atoms/multiselect-react-dropdown";
import { useControlledEffect } from "@features/utils/hooks/use-controlled-effect";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import _ from "lodash";
import { useState } from "react";
import { defaultInputClassName, errorInputClassName } from "./input-text";

interface InputProps
  extends Omit<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    "size" | "children" | "value" | "onChange"
  > {
  multiselectRef?: React.LegacyRef<Multiselect>;
  highlight?: boolean;
  theme?: "plain";
  hasError?: boolean;
  size?: "sm" | "md" | "lg" | "md";
  className?: string;
  value?: string[];
  onChange?: (e: string[]) => void;
  onSearch?: (e: string) => void;
  options: { label: string; value: string }[];
  selectionLimit?: number;
  placeholder?: string;
}

export function SelectMultiple(props: InputProps) {
  let inputClassName = props.hasError
    ? errorInputClassName(props.theme)
    : defaultInputClassName(props.theme);
  inputClassName = inputClassName + (props.disabled ? " opacity-50" : "");

  if (props.highlight && (props.value?.length || 0) > 0)
    inputClassName = inputClassName + " !ring !ring-yellow-500";

  if (props.size === "lg") inputClassName = inputClassName + " text-lg h-11";
  else if (props.size === "md")
    inputClassName = inputClassName + " text-sm h-7 py-0 px-3";
  else inputClassName = inputClassName + " text-base h-9";

  const [focused, setFocused] = useState(false);

  useControlledEffect(() => {
    props.onFocus && focused && props.onFocus(null as any);
    props.onBlur && !focused && props.onBlur(null as any);
  }, [focused]);

  return (
    <div className={"relative " + props.className}>
      <Multiselect
        ref={props.multiselectRef}
        singleSelect={props.selectionLimit === 1}
        selectionLimit={props.selectionLimit}
        onListFocus={() => setFocused(true)}
        onListBlur={() => setFocused(false)}
        className={
          inputClassName +
          " bg-white dark:bg-slate-990  border " +
          ((props.value || []).length === 0 ? "empty " : "") +
          (focused
            ? "ring-slate-600 ring-1 !border-slate-600 dark:border-slate-600 rounded-b-none "
            : "") +
          " " +
          ((props.value?.length || 0) > 0 ? " pr-12 " : " pr-8 ")
        }
        {..._.omit(props, "label", "className", "size", "value", "onChange")}
        selectedValues={props.options.filter((o) =>
          (props.value || []).includes(o.value)
        )}
        onSelect={(e: { value: string }[]) =>
          props.onChange && props.onChange(e.map((a) => a.value))
        }
        onRemove={(e: { value: string }[]) =>
          props.onChange && props.onChange(e.map((a) => a.value))
        }
        onSearch={(e: string) => {
          props.onSearch && props.onSearch(e);
        }}
        displayValue="label"
        options={props.options}
        showCheckbox
        style={{
          searchBox: {
            className: inputClassName,
          },
        }}
      />
      {(props.value?.length || 0) > 0 && (
        <XMarkIcon
          onClick={() => {
            props.onChange && props.onChange([]);
          }}
          className="h-4 w-4 cursor-pointer hover:opacity-50 bg-slate-700 p-0.5 text-white rounded-full absolute m-auto top-0 bottom-0 right-8"
        />
      )}
      <ChevronDownIcon className="h-5 w-5 pointer-events-none absolute m-auto top-0 bottom-0 right-2.5 text-slate-500" />
    </div>
  );
}

export default SelectMultiple;
