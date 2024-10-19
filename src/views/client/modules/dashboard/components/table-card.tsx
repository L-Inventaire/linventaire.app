import { Base } from "@atoms/text";
import React from "react";
import { twMerge } from "tailwind-merge";
import DashboardCard from "./card";
type TableCardProps = {
  title: string;
  items: { label: string; row: number; column: string; value: string }[];
  columns: { label: string; value: string }[];
  icon?: (p: any) => React.ReactNode;
} & React.ComponentProps<"div">;

const TableCard = ({
  title,
  items = [],
  icon,
  columns = [],
  ...props
}: TableCardProps) => {
  return (
    <DashboardCard
      icon={icon}
      title={title}
      className={twMerge("w-full flex-grow", props.className)}
      {...props}
    >
      <div
        className={twMerge(
          "grid w-full mt-2",
          "grid-cols-" + (columns?.length ?? 1)
        )}
      >
        {columns.map((col) => (
          <Base key={col.value}>{col.label}</Base>
        ))}
      </div>
    </DashboardCard>
  );
};

export default TableCard;
