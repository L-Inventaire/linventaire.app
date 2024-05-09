import { Tag } from "@atoms/badge/tag";
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export const RestDocumentTag = ({
  size,
  label,
  icon,
  className,
  onClick,
  dataTooltip,
}: {
  size: "md" | "sm";
  label: string | ReactNode;
  icon?: (p: { className: string }) => ReactNode;
  className?: string;
  onClick?: () => void;
  dataTooltip?: string;
}) => {
  return (
    <Tag
      icon={
        icon ? icon({ className: "mr-1 -ml-1 h-4 w-4 text-slate-500" }) : ""
      }
      size={size}
      noColor
      onClick={onClick}
      className={twMerge("bg-white dark:bg-slate-900 pr-1", className)}
      dataTooltip={dataTooltip}
    >
      {label}
    </Tag>
  );
};
