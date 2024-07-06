import _ from "lodash";
import { defaultInputClassName, errorInputClassName } from "./input-text";
import { InputLabel } from "./input-decoration-label";

export interface SelectInputProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  placeholder?: string;
  theme?: "plain";
  hasError?: boolean;
  size?: "sm" | "md" | "lg" | "md";
  className?: string;
  children?: React.ReactNode;
  highlight?: boolean;
  label?: string;
}

export function Select(props: SelectInputProps) {
  let inputClassName = props.hasError
    ? errorInputClassName(props.theme)
    : defaultInputClassName(props.theme);
  inputClassName = inputClassName + (props.disabled ? " opacity-50" : "");

  if (props.size === "lg") inputClassName = inputClassName + " text-lg h-11";
  else if (props.size === "md")
    inputClassName = inputClassName + " text-sm h-7 py-0 px-3 pr-8";
  else inputClassName = inputClassName + " text-base h-9 py-1";

  if (props.label) {
    return (
      <InputLabel
        label={props.label}
        input={<Select {...props} label={undefined} />}
      />
    );
  }

  return (
    <select
      className={inputClassName + " " + props.className}
      {..._.omit(props, "label", "className", "size")}
    >
      {props.children}
    </select>
  );
}

export default Select;
