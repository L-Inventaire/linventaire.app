import Link from "@atoms/link";
import { Shortcut, useShortcuts } from "@features/utils/shortcuts";
import _ from "lodash";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  theme?:
    | "primary"
    | "secondary"
    | "danger"
    | "default"
    | "outlined"
    | "invisible";
  size?: "md" | "lg" | "xl" | "sm";
  loading?: boolean;
  disabled?: boolean;
  shortcut?: Shortcut[];
  children?: React.ReactNode;
  to?: string;
  target?: string;
  icon?: (props: React.SVGProps<SVGSVGElement>) => JSX.Element;
}

export const Button = (props: ButtonProps) => {
  const disabled = props.disabled || props.loading;

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
    "text-white bg-wood-500 hover:bg-wood-600 active:bg-wood-700 border-px border-opacity-10 border-box border-black border-inside ";

  if (props.theme === "secondary")
    colors =
      "text-wood-500 bg-wood-100 hover:bg-wood-200 active:bg-wood-300 dark:bg-wood-900 dark:active:bg-wood-900 dark:hover:bg-wood-900 dark:text-slate-200 dark:hover:bg-opacity-75 dark:active:bg-opacity-10 border-px border-opacity-50 border-box border-black border-inside ";

  if (props.theme === "danger")
    colors =
      "text-white bg-rose-500 hover:bg-rose-600 active:bg-rose-700 border-px border-opacity-10 border-box border-black border-inside  ";

  if (props.theme === "default")
    colors =
      "text-black bg-white border-slate-200 hover:bg-slate-50 active:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-700 dark:active:bg-slate-700 dark:text-white dark:border-slate-900 border-px border-opacity-50 border-box border-black border-inside ";

  if (props.theme === "outlined")
    colors =
      "text-wood-400 bg-white dark:bg-wood-990 dark:hover:bg-wood-800 dark:active:bg-wood-900 hover:bg-wood-50 active:bg-wood-200 border-wood-400 border-solid	";

  if (props.theme === "invisible")
    colors =
      "text-wood-400 bg-transparent dark:hover:bg-wood-800 dark:active:bg-wood-900 hover:bg-wood-50 active:bg-wood-100 border-none";

  if (disabled) colors += " opacity-50 pointer-events-none";

  let className = colors;

  if (props.size === "xl") className = className + " text-base h-14 px-14 ";
  else if (props.size === "lg") className = className + " text-base h-11 px-8 ";
  else if (props.size === "sm") className = className + " px-3 text-sm h-7";
  else className = className + " px-4 text-base h-9";

  if (!props.children) {
    if (props.size === "lg")
      className = className + " w-11 !p-0 justify-center";
    else if (props.size === "sm")
      className = className + " w-7 !p-0 justify-center";
    else className = className + " w-12 !p-0 justify-center";
  }

  return (
    <button
      type="button"
      className={
        "whitespace-nowrap overflow-hidden text-ellipsis inline-flex items-center justify-center py-2 border text-sm font-medium rounded-md focus:outline-none " +
        className +
        " " +
        props.className
      }
      disabled={disabled}
      {..._.omit(props, "loading", "children", "className", "icon")}
    >
      {props.loading && (
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
          className: "h-4 w-4 " + (props.children ? "-ml-1 mr-2" : "-mx-2"),
        })}
      {props.children}
    </button>
  );
};
