import Multiselect from "@atoms/multiselect-react-dropdown";
import { useControlledEffect } from "@features/utils/hooks/use-controlled-effect";
import { XIcon } from "@heroicons/react/outline";
import { ChevronDownIcon } from "@heroicons/react/solid";
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
  size?: "md" | "lg" | "sm";
  className?: string;
  value?: { label: string; value: string }[];
  onChange?: (e: { label: string; value: string }[]) => void;
  onSearch?: (e: string) => void;
  options: { label: string; value: string }[];
  selectionLimit?: number;
  placeholder?: string;
}

export function SelectMultiple(props: InputProps) {
  let inputClassName = props.hasError
    ? errorInputClassName(props.theme)
    : defaultInputClassName(props.theme);
  inputClassName = inputClassName + (props.disabled ? " opacity-75" : "");

  if (props.highlight && (props.value?.length || 0) > 0)
    inputClassName = inputClassName + " !ring-2 !ring-yellow-500";

  if (props.size === "lg") inputClassName = inputClassName + " text-lg h-11";
  else if (props.size === "sm")
    inputClassName = inputClassName + " text-sm h-7 py-0 px-3";
  else inputClassName = inputClassName + " text-base h-9";

  const [focused, setFocused] = useState(false);

  useControlledEffect(() => {
    props.onFocus && focused && props.onFocus(null as any);
    props.onBlur && !focused && props.onBlur(null as any);
  }, [focused]);

  return (
    <div className="relative">
      <Multiselect
        ref={props.multiselectRef}
        singleSelect={props.selectionLimit === 1}
        selectionLimit={props.selectionLimit}
        onListFocus={() => setFocused(true)}
        onListBlur={() => setFocused(false)}
        className={
          inputClassName +
          " bg-white dark:bg-wood-990 border " +
          ((props.value || []).length === 0 ? "empty " : "") +
          (focused
            ? "ring-wood-600 ring-1 !border-wood-600 dark:border-wood-600 rounded-b-none "
            : "") +
          " " +
          ((props.value?.length || 0) > 0 ? " pr-12 " : " pr-8 ") +
          props.className
        }
        {..._.omit(props, "label", "className", "size", "value", "onChange")}
        selectedValues={props.value}
        onSelect={(e: { label: string; value: string }[]) =>
          props.onChange && props.onChange(e.map((a) => a))
        }
        onRemove={(e: { label: string; value: string }[]) =>
          props.onChange && props.onChange(e.map((a) => a))
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
        <XIcon
          onClick={() => {
            props.onChange && props.onChange([]);
          }}
          className="h-4 w-4 cursor-pointer hover:opacity-50 bg-wood-700 p-0.5 text-white rounded-full absolute m-auto top-0 bottom-0 right-8"
        />
      )}
      <ChevronDownIcon className="h-5 w-5 pointer-events-none absolute m-auto top-0 bottom-0 right-2.5 text-wood-500" />
    </div>
  );
}

export default SelectMultiple;
