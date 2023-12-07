import { ReactNode } from "react";

export const Badge = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => {
  if (!children) return <></>;

  return (
    <div
      style={{ minWidth: "21px" }}
      className={
        "bg-orange-400 rounded-full px-1.5 py-px text-sm text-white text-center " +
        (className || "")
      }
    >
      {children}
    </div>
  );
};
