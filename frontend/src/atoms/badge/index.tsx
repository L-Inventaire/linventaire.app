import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

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
      className={twMerge(
        "bg-red-500 rounded-full px-1.5 py-px text-sm text-white text-center ",
        className
      )}
    >
      {children}
    </div>
  );
};
