import { CSSProperties, ReactNode } from "react";

export const Tag = ({
  className,
  noColor,
  children,
  style,
}: {
  className?: string;
  noColor?: boolean;
  children: ReactNode;
  style?: CSSProperties;
}) => {
  if (!children) return <></>;

  return (
    <div
      style={{ ...(style || {}), minWidth: "21px" }}
      className={
        "text-left rounded inline-block px-1.5 py-px text-sm text-center " +
        (!noColor
          ? "bg-slate-300 text-slate-800 dark:bg-slate-600 dark:text-slate-100 "
          : "") +
        (className || "")
      }
    >
      {children}
    </div>
  );
};
