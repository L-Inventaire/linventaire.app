import Link from "@atoms/link";
import {
  Shortcut,
  showShortCut,
  useShortcuts,
} from "@features/utils/shortcuts";
import _ from "lodash";
import { useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  theme?:
    | "primary"
    | "secondary"
    | "danger"
    | "default"
    | "outlined"
    | "invisible";
  size?: "md" | "lg" | "xl" | "sm" | "xs";
  loading?: boolean;
  disabled?: boolean;
  shortcut?: Shortcut[];
  children?: React.ReactNode;
  to?: string;
  target?: string;
  icon?: (props: { className: string }) => JSX.Element;
  "data-tooltip"?: string;
}

export const Button = (props: ButtonProps) => {
  const disabled = props.disabled || props.loading;

  // Used to show a loader depending on the onClick promise function
  const asyncTimoutRef = useRef<any>(null);
  const [asyncLoading, setAsyncLoading] = useState(false);

  useShortcuts(
    !disabled && props.shortcut?.length ? [...props.shortcut] : [],
    (e) => {
      if (props.onClick) props.onClick(e as any);
    }
  );

  if (props.to) {
    return (
      <Link to={props.to} target={props.target} noColor>
        <Button {..._.omit(props, "to")} />
      </Link>
    );
  }

  let colors =
    "shadow-sm text-white bg-wood-500 hover:bg-wood-600 active:bg-wood-700 border-[0.5px] border-wood-600 hover:border-wood-700 ";

  if (props.theme === "secondary")
    colors =
      "shadow-sm text-wood-500 bg-wood-100 hover:bg-wood-200 active:bg-wood-300 dark:bg-wood-900 dark:active:bg-wood-900 dark:hover:bg-wood-900 dark:text-slate-200 dark:hover:bg-opacity-75 dark:active:bg-opacity-10 border-[0.5px] border-wood-200 hover:border-wood-300 dark:border-wood-900 dark:hover:border-wood-800";

  if (props.theme === "danger")
    colors =
      "shadow-sm text-white bg-rose-500 hover:bg-rose-600 active:bg-rose-700 border-[0.5px] border-red-600 hover:border-red-700";

  if (props.theme === "outlined" || props.theme === "default")
    colors =
      "shadow-sm text-black dark:text-white text-opacity-80 bg-white dark:bg-slate-900 dark:hover:bg-slate-800 hover:bg-gray-100 active:bg-gray-200 border-[0.5px] border-black border-opacity-15 border-solid border-inside dark:border-slate-700 dark:hover:border-slate-700 dark:active:bg-slate-700";

  if (props.theme === "invisible")
    colors =
      "shadow-none text-black dark:text-white text-opacity-80 bg-transparent dark:hover:bg-white dark:hover:bg-opacity-5 dark:active:bg-opacity-10 hover:bg-black hover:bg-opacity-5 active:bg-opacity-10 border-none";

  if (disabled) colors += " opacity-50 pointer-events-none";

  let className = colors;

  const size = props.size || "md";

  if (size === "xl") className = className + " text-base h-14 px-14 ";
  else if (size === "lg") className = className + " text-base h-11 px-8 ";
  else if (size === "sm") className = className + " px-3 text-base h-7";
  else if (size === "xs") className = className + " px-2 text-base h-6";
  else className = className + " px-4 text-base h-9";

  if (!props.children) {
    if (size === "lg") className = className + " w-11 !p-0 justify-center";
    else if (size === "sm") className = className + " w-7 !p-0 justify-center";
    else if (size === "xs") className = className + " w-6 !p-0 justify-center";
    else className = className + " w-12 !p-0 justify-center";
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

  return (
    <button
      data-tooltip={tooltip.length ? tooltip : undefined}
      type="button"
      className={twMerge(
        "print:hidden align-top whitespace-nowrap overflow-hidden text-ellipsis inline-flex items-center justify-center py-2 border text-sm font-medium rounded-md focus:outline-none",
        className,
        props.className
      )}
      onClick={
        props.onClick
          ? async (e) => {
              asyncTimoutRef.current = setTimeout(() => {
                setAsyncLoading(true);
              }, 500);
              await props.onClick!(e);
              setAsyncLoading(false);
              asyncTimoutRef.current && clearTimeout(asyncTimoutRef.current);
            }
          : undefined
      }
      disabled={disabled}
      {..._.omit(
        props,
        "onClick",
        "loading",
        "children",
        "className",
        "icon",
        "data-tooltip"
      )}
    >
      {(props.loading || asyncLoading) && (
        <>
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-10"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>{" "}
        </>
      )}
      {props.icon &&
        props.icon({
          className:
            "h-4 w-4 " +
            (props.children
              ? size === "xs"
                ? "-ml-1 mr-0.5"
                : size === "sm"
                ? "-ml-1 mr-1"
                : "-ml-1 mr-2"
              : "-mx-2"),
        })}
      <span className="mt-[2px]">{props.children}</span>
    </button>
  );
};
