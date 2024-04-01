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
        "text-left rounded inline-block px-1.5 py-px text-sm text-center border border-opacity-10 border-box border-black border-inside " +
        (!noColor
          ? "bg-wood-300 text-wood-800 dark:bg-wood-600 dark:text-wood-100 "
          : "") +
        (className || "")
      }
    >
      {children}
    </div>
  );
};
