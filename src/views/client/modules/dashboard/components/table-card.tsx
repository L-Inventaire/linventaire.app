import { Base } from "@atoms/text";
import { ScrollArea } from "@radix-ui/themes";
import _ from "lodash";
import React from "react";
import { twMerge } from "tailwind-merge";
import DashboardCard from "./card";

type TableCardItemProps = {
  label: string;
  column: string;
  props?: React.ComponentProps<"div">;
};

type TableCardProps = {
  title: string;
  rows: { key: string; items: TableCardItemProps[]; group?: string }[];
  columns: {
    label: string;
    value: string;
    props?: React.ComponentProps<"div">;
  }[];
  groups?: { label: string; key: string }[];
  icon?: (p: any) => React.ReactNode;
  tableProps?: React.ComponentProps<"div">;
} & React.ComponentProps<"div">;

const TableCard = ({
  title,
  rows = [],
  icon,
  columns = [],
  groups = [],
  tableProps,
  ...props
}: TableCardProps) => {
  return (
    <DashboardCard
      icon={icon}
      title={title}
      className={twMerge(
        "w-full h-full flex-grow flex flex-col",
        props.className
      )}
      {..._.omit(props ?? [], "className")}
    >
      <ScrollArea className="grow mt-1">
        <div
          className={twMerge(
            "grid w-full overflow-y-auto",
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

          {groups.length === 0 &&
            rows.map((row) => {
              return (
                <>
                  {columns.map((col) => {
                    const item = row.items.find(
                      (item) => item.column === col.value
                    );
                    return item ? (
                      <TableCardItem key={`${row}-${col.value}`} item={item} />
                    ) : (
                      <></>
                    );
                  })}
                </>
              );
            })}
          {groups.length > 0 &&
            groups.flatMap((group) => {
              const groupRows = rows.filter((row) => row.group === group.key);
              return (
                <>
                  {groupRows.length > 0 && (
                    <div className="flex justify-center items-center col-span-3 text-gray-500 text-xs">
                      <div className="flex grow h-[1px] bg-gray-300 mr-3"></div>
                      {group.label}
                      <div className="flex grow h-[1px] bg-gray-300 ml-3"></div>
                    </div>
                  )}
                  {groupRows.map((row) => {
                    return (
                      <>
                        {columns.map((col) => {
                          const item = row.items.find(
                            (item) => item.column === col.value
                          );
                          return item ? (
                            <TableCardItem
                              key={`${row.key}-${col.value}`}
                              item={item}
                            />
                          ) : (
                            <></>
                          );
                        })}
                      </>
                    );
                  })}
                </>
              );
            })}
        </div>
      </ScrollArea>
    </DashboardCard>
  );
};

const TableCardItem = ({ item }: { item: TableCardItemProps }) => {
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
};

export default TableCard;
