import { Shortcut, useShortcuts } from "@features/utils/shortcuts";
import _ from "lodash";
import React, { useEffect } from "react";
import { InputLabel } from "./input-decoration-label";

export interface InputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement> &
      React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    "size"
  > {
  highlight?: boolean;
  theme?: "plain";
  label?: string;
  size?: "sm" | "md" | "lg";
  feedback?: string;
  hasError?: boolean;
  multiline?: boolean;
  inputComponent?: React.ReactNode;
  inputClassName?: string;
  className?: string;
  inputRef?: React.Ref<HTMLInputElement | HTMLTextAreaElement>;
  shortcut?: Shortcut[];
  autoFocus?: boolean;
}

export const defaultInputClassName = (theme: "plain" = "plain") => {
  return "shadow-sm focus:ring-wood-500 focus:border-wood-500 block text-base border-black border-opacity-15 dark:bg-slate-990 dark:border-slate-900 dark:text-white rounded-md";
};

export const errorInputClassName = (theme: "plain" = "plain") => {
  return (
    defaultInputClassName(theme) +
    " bg-red-50 border-red-300 dark:bg-red-900 dark:border-red-800"
  );
};

export const Input = (props: InputProps) => {
  let inputClassName = props.hasError
    ? errorInputClassName(props.theme)
    : defaultInputClassName(props.theme);
  inputClassName = inputClassName + (props.disabled ? " opacity-50" : "");

  const internalRef = React.useRef<HTMLInputElement | HTMLTextAreaElement>();
  const inputRef = props.inputRef || internalRef;

  if (props.highlight && props.value)
    inputClassName = inputClassName + " ring-2 ring-yellow-500";

  if (!props.multiline) {
    if (props.size === "lg") inputClassName = inputClassName + " h-11";
    else if (props.size === "sm") inputClassName = inputClassName + " h-7";
    else inputClassName = inputClassName + " h-9";
  }

  if (props.size === "lg") inputClassName = inputClassName + " px-4";

  useShortcuts(
    !props.disabled && props.shortcut?.length ? [...props.shortcut] : [],
    (e) => {
      (inputRef as any)?.current?.focus();
    }
  );

  useEffect(() => {
    if (props.autoFocus) {
      (inputRef as any)?.current?.focus();
    }
  }, [props.autoFocus]);

  if (props.label) {
    return (
      <InputLabel
        label={props.label}
        input={<Input {...props} label={undefined} />}
      />
    );
  }

  return (
    <>
      {props.inputComponent ||
        (props.multiline ? (
          <textarea
            ref={inputRef as React.Ref<HTMLTextAreaElement>}
            className={
              inputClassName +
              " " +
              props.inputClassName +
              " " +
              props.className
            }
            {..._.omit(
              props as any,
              "label",
              "inputClassName",
              "className",
              "value",
              "size",
              "multiline",
              "inputRef"
            )}
            value={props.value}
          />
        ) : (
          <input
            ref={inputRef as React.Ref<HTMLInputElement>}
            type="text"
            className={
              inputClassName +
              " " +
              props.inputClassName +
              " " +
              props.className
            }
            onFocus={(e) => {
              if (props?.type === "number" && e.target.value === "0") {
                e.target.select();
              }
            }}
            {..._.omit(props, "label", "inputClassName", "className", "size")}
          />
        ))}
    </>
  );
};
