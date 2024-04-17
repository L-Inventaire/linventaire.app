import { CSSProperties, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export const Tag = ({
  color,
  className,
  noColor,
  children,
  size,
  style,
  onClick,
}: {
  color?: string;
  className?: string;
  noColor?: boolean;
  children: ReactNode;
  size?: "sm" | "md";
  style?: CSSProperties;
  onClick?: () => void;
}) => {
  if (!children) return <></>;

  if (color) {
    noColor = true;
    style = { ...style, backgroundColor: color };
    className = (className || "") + " text-white";
  }

  return (
    <div
      onClick={onClick}
      style={{ ...(style || {}), minWidth: "21px" }}
      className={twMerge(
        size === "sm" ? "h-5 px-1" : "h-7 px-2",
        "text-left rounded inline-block inline-flex items-center text-sm text-center border border-opacity-10 dark:border-opacity-10 dark:border-slate-500 border-box border-black border-inside " +
          (!noColor
            ? "bg-wood-300 text-wood-800 dark:bg-wood-600 dark:text-wood-100 "
            : "") +
          (className || "")
      )}
    >
      {children}
    </div>
  );
};
