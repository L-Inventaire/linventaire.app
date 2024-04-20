import { Tag } from "@atoms/badge/tag";
import { ReactNode } from "react";

export const RestDocumentTag = ({
  size,
  label,
  icon,
}: {
  size: "md" | "sm";
  label: string | ReactNode;
  icon: (p: { className: string }) => ReactNode;
}) => {
  return (
    <Tag size={size} noColor className="bg-white dark:bg-slate-900 pr-1">
      {icon({ className: "mr-1 -ml-1 h-4 w-4 text-slate-500" })}
      {label}
    </Tag>
  );
};
