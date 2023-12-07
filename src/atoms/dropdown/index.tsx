import _ from "lodash";
import RDropdown from "./dropdown";
import "./index.css";

interface Option {
  label: React.ReactNode;
  value: string;
  className?: string;
  data?: {
    [dataAttribute: string]: string | number;
  };
}
interface Group {
  type: "group";
  name: string;
  items: Option[];
}
interface ReactDropdownProps {
  options: (Group | Option | string)[];
  baseClassName?: string;
  className?: string;
  controlClassName?: string;
  placeholderClassName?: string;
  menuClassName?: string;
  arrowClassName?: string;
  disabled?: boolean;
  arrowClosed?: React.ReactNode;
  arrowOpen?: React.ReactNode;
  onChange?: (arg: Option) => void;
  onFocus?: (arg: boolean) => void;
  value?: Option | string;
  placeholder?: String;
}

export interface DropdownProps extends ReactDropdownProps {
  theme?: "primary" | "secondary" | "danger" | "default" | "outlined";
  size?: "md" | "lg" | "xl" | "sm";
  loading?: boolean;
  disabled?: boolean;
  align?: "left" | "right";
}

export const Dropdown = (props: DropdownProps) => {
  const disabled = props.disabled || props.loading;

  let colors =
    "text-white bg-blue-500 hover:bg-blue-600 active:bg-blue-800 border-transparent drop-shadow-sm	";

  if (props.theme === "secondary")
    colors =
      "text-blue-500 bg-blue-100 hover:bg-blue-200 active:bg-blue-200 border-transparent ";

  if (props.theme === "danger")
    colors =
      "text-white bg-rose-500 hover:bg-rose-600 active:bg-rose-700 border-transparent ";

  if (props.theme === "default")
    colors =
      "text-black bg-white border-slate-200 hover:bg-slate-50 active:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:active:bg-slate-700 dark:text-white dark:border-slate-900";

  if (props.theme === "outlined")
    colors =
      "text-blue-400 bg-white dark:bg-slate-900 dark:hover:bg-slate-800 dark:active:bg-slate-900 hover:bg-slate-50 active:bg-slate-200 border-blue-400 border-solid	";

  if (disabled) colors += " opacity-50 pointer-events-none";

  let className = colors;

  if (props.size === "xl") className = className + " text-base h-14 px-12 ";
  else if (props.size === "lg") className = className + " text-base h-11 px-6 ";
  else if (props.size === "sm")
    className = className + " px-4 text-sm h-8 px-3";
  else className = className + " px-4 text-base h-9";

  return (
    <RDropdown
      baseClassName={"Dropdown"}
      className={
        "overflow-visible inline-flex items-center justify-center text-sm cursor-pointer " +
        (props.align === "left" ? "dropdown-align-left " : "") +
        props.className
      }
      controlClassName={
        "whitespace-nowrap text-ellipsis inline-flex items-center justify-center py-2 border text-sm font-medium rounded focus:outline-none pr-8 " +
        className
      }
      menuClassName={
        "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg overflow-hidden z-10"
      }
      disabled={disabled}
      value={""}
      {..._.omit(props, "loading", "children", "className")}
    />
  );
};
