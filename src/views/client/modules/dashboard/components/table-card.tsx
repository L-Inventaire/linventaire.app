import { Base } from "@atoms/text";
import React from "react";
import { twMerge } from "tailwind-merge";
import DashboardCard from "./card";
import _ from "lodash";
type TableCardProps = {
  title: string;
  items: {
    label: string;
    row: number;
    column: string;
    props?: React.ComponentProps<"div">;
  }[];
  columns: {
    label: string;
    value: string;
    props?: React.ComponentProps<"div">;
  }[];
  icon?: (p: any) => React.ReactNode;
  tableProps?: React.ComponentProps<"div">;
} & React.ComponentProps<"div">;

const TableCard = ({
  title,
  items = [],
  icon,
  columns = [],
  tableProps,
  ...props
}: TableCardProps) => {
  const rows = _.uniq(items.map((item) => item.row)).sort();

  return (
    <DashboardCard
      icon={icon}
      title={title}
      className={twMerge("w-full h-full flex-grow", props.className)}
      {..._.omit(props ?? [], "className")}
    >
      <div
        className={twMerge(
          "grid w-full mt-2 overflow-y-auto h-[calc(100%-2rem)]",
          "grid-cols-" + (columns?.length ?? 1),
          tableProps?.className
        )}
        {..._.omit(tableProps, "className")}
      >
        {columns.map((col) => (
          <Base
            key={col.value}
            className={twMerge(
              "text-gray-500 p-2 -ml-2",
              col?.props?.className
            )}
            {..._.omit(col?.props ?? [], "className", "key")}
          >
            {col.label}
          </Base>
        ))}

        {rows.map((row) => {
          return (
            <>
              {columns.map((col) => {
                const item = items.find(
                  (item) => item.row === row && item.column === col.value
                );
                return (
                  <div
                    className={twMerge(
                      "hover:bg-slate-50 cursor-pointer p-2 -ml-2",
                      item?.props?.className
                    )}
                    {..._.omit(item?.props ?? [], "className")}
                  >
                    {item?.label}
                  </div>
                );
              })}
            </>
          );
        })}
      </div>
    </DashboardCard>
  );
};

export default TableCard;
