import Link from "@atoms/link";
import { Tooltip } from "@atoms/tooltip";
import {
  Shortcut,
  showShortCut,
  useShortcuts,
} from "@features/utils/shortcuts";
import { IconButton, Button as RdxButton, Spinner } from "@radix-ui/themes";
import _ from "lodash";
import { ReactNode, useRef, useState } from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  btnRef?: any;
  theme?:
    | "primary"
    | "secondary"
    | "danger"
    | "default"
    | "outlined"
    | "invisible";
  size?: "xl" | "lg" | "md" | "sm" | "xs";
  loading?: boolean;
  disabled?: boolean;
  shortcut?: Shortcut[];
  children?: React.ReactNode;
  to?: string;
  target?: string;
  icon?: (props: { className: string }) => ReactNode | JSX.Element;
  "data-tooltip"?: string;
  readonly?: boolean;
  danger?: boolean;
}

export const Button = (props: ButtonProps) => {
  const disabled = props.disabled || props.loading;
  const internalRef = useRef<HTMLButtonElement>(null);
  const btnRef = props.btnRef || internalRef;

  // Used to show a loader depending on the onClick promise function
  const asyncTimoutRef = useRef<any>(null);
  const [asyncLoading, setAsyncLoading] = useState(false);
  const loading = asyncLoading || props.loading;

  useShortcuts(
    !props.to && !disabled && props.shortcut?.length ? [...props.shortcut] : [],
    (e) => {
      if (props.onClick)
        props.onClick({
          ...e,
          currentTarget: btnRef.current,
          preventDefault: () => {},
          stopPropagation: () => {},
        } as any);
    }
  );

  if (props.to && !disabled) {
    return (
      <Link
        to={props.to}
        target={props.target}
        noColor
        shortcut={props.shortcut}
      >
        <Button {..._.omit(props, "to", "shortcut")} />
      </Link>
    );
  }

  const tooltip = [
    props["data-tooltip"] || "",
    props.shortcut &&
      !props["data-tooltip"] &&
      typeof props.children === "string" &&
      props.children,
    props.shortcut ? `\`${showShortCut(props.shortcut)}\`` : "",
  ]
    .filter((a) => a)
    .join(" ");

  const size = {
    xs: "1",
    sm: "2",
    md: "3",
    lg: "3",
    xl: "4",
  }[props.size || "md"] as any;

  const variant =
    (
      {
        outlined: "outline",
        invisible: "ghost",
        primary: "solid",
        secondary: "soft",
      } as any
    )[props.theme as any] || "solid";

  const color =
    props.theme === "danger" || props.danger ? "crimson" : undefined;

  const onClick = props.onClick
    ? async (e: any) => {
        if (props.readonly) return;
        asyncTimoutRef.current = setTimeout(() => {
          setAsyncLoading(true);
        }, 500);
        await props.onClick!(e);
        setAsyncLoading(false);
        asyncTimoutRef.current && clearTimeout(asyncTimoutRef.current);
      }
    : undefined;

  return (
    <Tooltip content={tooltip}>
      <>
        {!props.children && (
          <IconButton
            size={size}
            className={props.className}
            loading={loading}
            color={color}
            variant={variant}
            onClick={onClick}
            disabled={disabled}
          >
            {props.icon && props.icon({ className: "w-4 h-4 shrink-0" })}
          </IconButton>
        )}
        {!!props.children && (
          <RdxButton
            size={size}
            className={props.className}
            loading={!props.icon && loading}
            color={color}
            variant={variant}
            onClick={onClick}
            disabled={disabled}
          >
            {props.icon && (
              <Spinner loading={loading || false}>
                {props.icon({ className: "w-4 h-4 shrink-0" })}
              </Spinner>
            )}
            {props.children}
          </RdxButton>
        )}
      </>
    </Tooltip>
  );
};
