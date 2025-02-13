import { BaseSmall } from "@atoms/text";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline";
import _ from "lodash";
import { twMerge } from "tailwind-merge";
import { Column, Pagination } from "./table";

export type TableCellHeaderProps<T> = {
  index: number;
  header?: boolean;
  columns: Column<T>[];
  column: Column<T>;
  scrollable?: boolean;
  onChangeOrder?: (orderBy: string, direction: "ASC" | "DESC") => void;
  pagination?: Pagination;
} & React.HTMLAttributes<HTMLTableHeaderCellElement>;

export function TableCellHeader<T>({
  index,
  column,
  columns,
  scrollable,
  onChangeOrder,
  pagination,
  ...props
}: TableCellHeaderProps<T>) {
  return (
    <>
      <th
        className={twMerge(
          "font-medium px-1 py-1 opacity-50 ",
          column.orderBy && "cursor-pointer hover:bg-opacity-75",
          scrollable && "sticky top-0 z-10",
          column.thClassName
        )}
        onClick={() => {
          if (column.orderBy) {
            onChangeOrder &&
              onChangeOrder(
                column.orderBy,
                pagination?.order === "ASC" ? "DESC" : "ASC"
              );
          }
        }}
        {..._.omit(props, "onChange")}
      >
        <div
          className={twMerge(
            "items-center flex text-slate-500 group/colheader whitespace-nowrap",
            column.headClassName || "",
            index === columns.length - 1 && "pr-1"
          )}
        >
          <BaseSmall>{column.title}</BaseSmall>
          {column.orderBy && (
            <div className="w-8 flex items-center ml-1">
              {pagination?.orderBy === column?.orderBy &&
                pagination.order === "DESC" && (
                  <ArrowUpIcon className="h-4 w-4 text-slate-500 inline" />
                )}
              {pagination?.orderBy === column?.orderBy &&
                pagination.order !== "DESC" && (
                  <ArrowDownIcon className="h-4 w-4 text-slate-500 inline" />
                )}
              {pagination?.orderBy !== column?.orderBy && !!column.orderBy && (
                <ArrowDownIcon className="group-hover/colheader:opacity-100 h-4 w-4 text-slate-500 opacity-0 inline" />
              )}
            </div>
          )}
        </div>
      </th>
    </>
  );
}
