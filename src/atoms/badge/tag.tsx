import { CSSProperties, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export const Tag = ({
  color,
  className,
  children,
  size,
  icon,
  style,
  onClick,
  ...props
}: {
  color?: string;
  className?: string;
  noColor?: boolean;
  children: ReactNode;
  size?: "xs" | "sm" | "md" | "lg";
  icon?: ReactNode;
  style?: CSSProperties;
  onClick?: (e: MouseEvent) => void;
  "data-tooltip"?: string;
}) => {
  if (!children) return <></>;

  return (
    <div
      data-tooltip={
        props["data-tooltip"] === undefined
          ? typeof children === "string"
            ? children
            : ""
          : props["data-tooltip"]
      }
      onClick={(e: any) => onClick && onClick(e)}
      style={{
        ...(style || {}),
        minWidth: "21px",
      }}
      className={twMerge(
        size === "sm"
          ? "h-6 px-2 pr-2.5"
          : size === "xs"
          ? "h-5 pr-1.5 pl-1"
          : size === "md"
          ? "h-7 px-2 pr-2.5"
          : "h-7 px-2 pr-2.5",
        "text-center rounded-md inline-flex items-center text-sm border-box",
        "text-black dark:text-white text-opacity-80 bg-white dark:bg-slate-900 border border-black border-opacity-15 border-solid border-inside dark:border-slate-700",
        onClick &&
          "cursor-pointer dark:hover:bg-slate-800 hover:bg-gray-100 active:bg-gray-200 dark:hover:border-slate-700 dark:active:bg-slate-700",
        "align-top text-ellipsis whitespace-nowrap overflow-hidden min-w-0 max-w-full shrink-0",
        className
      )}
    >
      {icon ||
        (color ? (
          <div
            className={twMerge(
              "shrink-0 w-2.5 h-2.5 rounded-full mr-1.5",
              color.indexOf("#") !== 0 && `bg-${color}-500`
            )}
            style={color.indexOf("#") === 0 ? { backgroundColor: color } : {}}
          />
        ) : (
          ""
        ))}
      <span className="grow text-ellipsis whitespace-nowrap overflow-hidden min-w-0 shrink-0">
        {children}
      </span>
    </div>
  );
};
