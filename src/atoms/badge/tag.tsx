import { CSSProperties, ReactNode } from "react";

export const Tag = ({
  color,
  className,
  noColor,
  children,
  style,
  onClick,
}: {
  color?: string;
  className?: string;
  noColor?: boolean;
  children: ReactNode;
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
      className={
        "h-7 text-left rounded inline-block px-2 inline-flex items-center text-sm text-center border border-opacity-10 border-box border-black border-inside " +
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
