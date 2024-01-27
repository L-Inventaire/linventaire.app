import { Shortcut, useShortcuts } from "@features/utils/shortcuts";
import _ from "lodash";
import React from "react";
import { defaultInputClassName } from "./input/input-text";

interface InputProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  placeholder?: string;
  highlight?: boolean;
  className?: string;
  size?: "md" | "sm";
  children?: React.ReactNode;
  shortcut?: Shortcut[];
}

export default function Select(props: InputProps) {
  const ref = React.useRef<HTMLSelectElement>();

  useShortcuts(
    !props.disabled && props.shortcut?.length ? [...props.shortcut] : [],
    (e) => {
      ref?.current?.focus();
      ref?.current?.click();
    }
  );

  return (
    <select
      className={
        defaultInputClassName("plain") +
        " cursor-pointer rounded " +
        props.className +
        " " +
        (props.size === "sm" ? "h-8 py-1 pr-8" : " h-9 ") +
        " " +
        (props.highlight && props.value ? " ring-2 ring-yellow-500" : "")
      }
      ref={ref as any}
      {..._.omit(props, "label", "className", "size")}
    >
      {props.children}
    </select>
  );
}
