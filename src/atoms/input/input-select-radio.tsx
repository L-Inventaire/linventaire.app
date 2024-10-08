import _ from "lodash";
import React from "react";
import { InputLabel } from "./input-decoration-label";
import { defaultInputClassName, errorInputClassName } from "./input-text";
import { twMerge } from "tailwind-merge";

export interface RadioProps
  extends Omit<
    React.ComponentProps<"fieldset">,
    "size" | "className" | "label" | "placeholder" | "onChange" | "value"
  > {
  placeholder?: string;
  theme?: "plain";
  hasError?: boolean;
  size?: "sm" | "md" | "lg" | "md";
  className?: string;
  children?: React.ReactNode;
  highlight?: boolean;
  label?: string;
  value?: string;
  layout?: "horizontal" | "vertical";
  onChange?: (e: string) => void;
  options: { label: string; value: string }[];
}

export function Radio(props: RadioProps) {
  let inputClassName = props.hasError
    ? errorInputClassName(props.theme)
    : defaultInputClassName(props.theme);
  inputClassName = inputClassName + (props.disabled ? " opacity-50" : "");

  if (props.size === "lg") inputClassName = inputClassName + " text-lg h-11";
  else if (props.size === "md")
    inputClassName = inputClassName + " text-sm py-0 px-3 pr-8";
  else inputClassName = inputClassName + " text-base h-9 py-1";

  const layout = props?.layout ?? "horizontal";

  if (props.label) {
    return (
      <InputLabel
        label={props.label}
        input={<Radio {...props} label={undefined} />}
      />
    );
  }

  return (
    <fieldset
      className={twMerge(
        inputClassName,
        layout === "horizontal" && "flex",
        props.className
      )}
      {..._.omit(
        props,
        "label",
        "className",
        "size",
        "highlight",
        "onChange",
        "value"
      )}
      onChange={(e) => {
        // @ts-ignore Event bubbling
        props.onChange?.(e?.target?.value ?? "");
      }}
    >
      {props.options.map((option) => (
        <div className={twMerge("flex", layout === "horizontal" && "mr-2")}>
          <label>
            <input
              type="radio"
              value={option.value}
              name={props.name}
              checked={props.value === option.value}
              onChange={(e) => {
                /* Do nothing, it's for event bubbling */
              }}
            />{" "}
            {option.label}
          </label>
        </div>
      ))}
      {props.children}
    </fieldset>
  );
}

export default Radio;
