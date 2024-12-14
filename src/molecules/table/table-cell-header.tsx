import { BaseSmall } from "@atoms/text";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline";
import { twMerge } from "tailwind-merge";
import { Column, Pagination } from "./table";
import _ from "lodash";

export type TableCellHeaderProps<T> = {
  index: number;
  header?: boolean;
  columns: Column<T>[];
  column: Column<T>;
  scrollable?: boolean;
  onChangeOrder?: (columnIndex: number, direction: "ASC" | "DESC") => void;
  pagination?: Pagination;
} & React.HTMLAttributes<HTMLTableHeaderCellElement>;

const CellComponent = ({
  header,
  children,
}: {
  header: boolean;
  children: any;
}) => {
  if (header) {
    return <th>{children}</th>;
  }
  return <td>{children}</td>;
};

export function TableCellHeader<T>({
  index,
  header = false,
  column,
  columns,
  scrollable,
  onChangeOrder,
  pagination,
  ...props
}: TableCellHeaderProps<T>) {
  return (
    <>
      <CellComponent
        header={header}
        className={twMerge(
          "font-medium px-1 py-1 opacity-50",
          column.orderable && "cursor-pointer hover:bg-opacity-75",
          scrollable && "sticky top-0 z-10",
          column.thClassName
        )}
        onClick={() => {
          if (column.orderable) {
            onChangeOrder &&
              onChangeOrder(
                index,
                pagination?.order === "ASC" ? "DESC" : "ASC"
              );
          }
        }}
        {..._.omit(props, "onChange")}
      >
        <div
          className={twMerge(
            "items-center flex text-slate-500 table-hover-sort-container whitespace-nowrap",
            column.headClassName || "",
            index === columns.length - 1 && "pr-1"
          )}
        >
          <BaseSmall noColor={pagination?.orderBy === index}>
            {column.title}
          </BaseSmall>
          {column.orderable && (
            <div className="w-8 flex items-center ml-1">
              {pagination?.orderBy === index && pagination.order === "DESC" && (
                <ArrowUpIcon className="h-4 w-4 text-slate-500 inline" />
              )}
              {pagination?.orderBy === index && pagination.order !== "DESC" && (
                <ArrowDownIcon className="h-4 w-4 text-slate-500 inline" />
              )}
              {pagination?.orderBy !== index && column.orderable && (
                <ArrowDownIcon className="table-hover-sort h-4 w-4 text-slate-500 opacity-50 inline" />
              )}
            </div>
          )}
        </div>
      </CellComponent>
    </>
  );
}
