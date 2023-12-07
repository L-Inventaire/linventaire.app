import { Dropdown } from "@atoms/dropdown";
import { Checkbox } from "@atoms/input/input-checkbox";
import { Loader } from "@atoms/loader";
import { Base, Info } from "@atoms/text";
import { ArrowSmDownIcon, ArrowSmUpIcon } from "@heroicons/react/outline";
import _ from "lodash";
import { ReactNode, useEffect, useState } from "react";
import { TablePagination } from "./pagination";

export type Column<T> = {
  title?: string | ReactNode;
  className?: string;
  thClassName?: string;
  headClassName?: string;
  orderable?: boolean;
  render: (item: T) => string | ReactNode;
};

export type Pagination = {
  total: number;
  page: number;
  perPage: number;
  orderBy?: number;
  order?: "ASC" | "DESC";
};

type PropsType<T> = {
  columns: Column<T>[];
  data: T[];
  rowIndex?: string;
  cellClassName?: (row: T) => string;
  className?: string;
  pagination?: Pagination;
  scrollable?: boolean;
  loading?: boolean;
  onSelect?:
    | {
        icon?: (props: any) => JSX.Element;
        label: string | ReactNode;
        callback: (items: T[]) => void;
      }[]
    | ((items: T[]) => void);
  onClick?: (item: T) => void;
  onChangeOrder?: (columnIndex: number, direction: "ASC" | "DESC") => void;
  onChangePage?: (page: number) => void;
  onChangePageSize?: (size: number) => void;
};

export function RenderedTable<T>({
  columns,
  data,
  rowIndex,
  pagination,
  loading,
  scrollable,
  onSelect,
  onClick,
  onChangeOrder,
  onChangePage,
  onChangePageSize,
  cellClassName,
  className,
}: PropsType<T>) {
  const [selected, setSelected] = useState<T[]>([]);

  useEffect(() => {
    setSelected([]);
  }, [data.length, pagination?.page, pagination?.perPage]);

  useEffect(() => {
    if (onSelect && typeof onSelect === "function") onSelect(selected);
  }, [selected, onSelect]);

  scrollable = true;

  return (
    <div
      className={
        "not-prose text-left border-slate-200 dark:border-slate-700 relative rounded overflow-hidden " +
        (className || "")
      }
    >
      <div
        className={
          "relative rounded overflow-auto " + (scrollable ? "h-full " : "")
        }
      >
        {loading && (
          <div className="absolute m-auto left-0 top-0 right-0 bottom-0 w-6 h-6 text-center z-10">
            <Loader color="text-blue-400" />
          </div>
        )}

        <table
          className={
            "border-collapse table-fixed w-auto min-w-full " +
            (loading ? " opacity-75 animate-pulse " : "") +
            (scrollable ? " scrollable h-full " : "")
          }
        >
          {columns.map((c) => c.title || "").join("") && (
            <thead>
              <tr>
                {onSelect && (
                  <th
                    className={
                      "w-8 shrink-0 relative " +
                      (scrollable
                        ? " sticky top-0 bg-slate-50 dark:bg-slate-800 "
                        : "")
                    }
                  >
                    <div
                      className="absolute z-10 mt-1 top-0 left-0 "
                      style={{
                        boxShadow: "40px 0 20px #F8FAFC",
                      }}
                    >
                      {selected.length > 0 &&
                        typeof onSelect !== "function" && (
                          <Dropdown
                            align="left"
                            theme="primary"
                            size="sm"
                            placeholder={`${selected.length || 0} item${
                              selected.length > 1 ? "s" : ""
                            }`}
                            options={onSelect.map((a) => ({
                              value: "customer",
                              label: (
                                <span
                                  onClick={() => a.callback(selected)}
                                  className="flex items-center p-2 font-normal"
                                >
                                  {a.icon && (
                                    <a.icon className="h-4 w-4 mr-2" />
                                  )}
                                  {a.label}
                                </span>
                              ),
                            }))}
                          />
                        )}
                    </div>
                  </th>
                )}
                {columns.map((column, i) => (
                  <th
                    key={i}
                    className={
                      "font-medium p-4 py-3  " +
                      (column.orderable
                        ? "cursor-pointer hover:opacity-75 "
                        : "") +
                      (scrollable
                        ? " sticky top-0 bg-slate-50 dark:bg-slate-800 z-10 "
                        : "") +
                      (column.thClassName || "")
                    }
                    onClick={() => {
                      if (column.orderable) {
                        onChangeOrder &&
                          onChangeOrder(
                            i,
                            pagination?.order === "ASC" ? "DESC" : "ASC"
                          );
                      }
                    }}
                  >
                    <div
                      className={
                        "items-center flex text-blue-400 table-hover-sort-container  " +
                        (column.headClassName || "")
                      }
                    >
                      <Info
                        className="uppercase"
                        noColor={pagination?.orderBy === i}
                      >
                        {column.title}
                      </Info>
                      {column.orderable && (
                        <div className="w-8 flex items-center ml-1">
                          {pagination?.orderBy === i &&
                            pagination.order === "DESC" && (
                              <ArrowSmUpIcon className="h-4 w-4 text-blue-400 inline" />
                            )}
                          {pagination?.orderBy === i &&
                            pagination.order !== "DESC" && (
                              <ArrowSmDownIcon className="h-4 w-4 text-blue-400 inline" />
                            )}
                          {pagination?.orderBy !== i && column.orderable && (
                            <ArrowSmDownIcon className="table-hover-sort h-4 w-4 text-slate-500 opacity-50 inline" />
                          )}
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="overflow-hidden ">
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length + (onSelect ? 1 : 0)}>
                  <div
                    className={
                      " p-4 text-center" +
                      (scrollable
                        ? ""
                        : "bg-white dark:bg-slate-700 border rounded border-slate-200 dark:border-slate-600")
                    }
                  >
                    <Info>No data</Info>
                  </div>
                </td>
              </tr>
            )}
            {data.map((row, i) => {
              if (onSelect && !rowIndex)
                throw new Error(
                  "rowIndex is required when onSelect is defined"
                );
              const isSelected = selected
                .map((a) => (a as any)[rowIndex || "id"])
                .includes((row as any)[rowIndex || "id"]);
              return (
                <tr
                  key={i}
                  onClick={() => onClick && onClick(row)}
                  className={onClick ? "cursor-pointer hover:opacity-75" : ""}
                >
                  {onSelect && (
                    <td>
                      <Checkbox
                        className="mr-2"
                        value={isSelected}
                        onChange={(a, e) => {
                          //Code to manage shift click range
                          if (
                            (e.shiftKey || e.ctrlKey) &&
                            selected.length > 0
                          ) {
                            let anchor = selected[selected.length - 1];
                            let start = false;
                            let newSelection: T[] = [];
                            for (const d of data) {
                              if (
                                (d as any)[rowIndex || "id"] ===
                                  (anchor as any)[rowIndex || "id"] ||
                                (d as any)[rowIndex || "id"] ===
                                  (row as any)[rowIndex || "id"]
                              ) {
                                if (start) {
                                  newSelection.push(d);
                                  break;
                                }
                                if (!start) start = true;
                              }
                              if (start) {
                                newSelection.push(d);
                              }
                            }
                            setSelected(
                              _.uniqBy(
                                [
                                  ...selected.filter(
                                    (s) => !newSelection.includes(s)
                                  ),
                                  ...(a ? newSelection : []),
                                  anchor,
                                ],
                                (s) => (s as any)[rowIndex || "id"]
                              )
                            );
                          } else {
                            if (a) {
                              setSelected(
                                _.uniqBy(
                                  [...selected, row],
                                  (s) => (s as any)[rowIndex || "id"]
                                )
                              );
                            } else {
                              setSelected(selected.filter((s) => s !== row));
                            }
                          }
                        }}
                      />
                    </td>
                  )}
                  {columns.map((cell, j) => {
                    const jFirst = j === 0;
                    const jLast = j === columns.length - 1;
                    const iFirst = i === 0;
                    const iLast = i === data.length - 1;
                    return (
                      <td
                        key={j}
                        className="m-0 p-0 height-table-hack overflow-hidden"
                      >
                        <div
                          className={
                            "h-full w-full flex items-center border-t border-slate-200 dark:border-slate-600 " +
                            (i % 2
                              ? isSelected
                                ? "dark:bg-opacity-90 bg-opacity-90 "
                                : "dark:bg-opacity-25 bg-opacity-25 "
                              : "") +
                            ((jFirst && " border-l ") || "") +
                            ((jLast && " border-r ") || "") +
                            ((iLast && " border-b ") || "") +
                            ((iFirst && jFirst && " rounded-tl ") || "") +
                            ((iFirst && jLast && " rounded-tr ") || "") +
                            ((iLast && jFirst && " rounded-bl ") || "") +
                            ((iLast && jLast && " rounded-br ") || "") +
                            (isSelected
                              ? " bg-blue-200 dark:bg-blue-800 "
                              : " bg-white dark:bg-slate-700 ") +
                            (cell.className || "")
                          }
                        >
                          <Base
                            className={
                              "w-full py-2 px-4 inline-flex items-center h-full " +
                              (cellClassName?.(row) || "")
                            }
                          >
                            {cell.render(row)}
                          </Base>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
          {!!pagination && (
            <tfoot>
              <tr>
                <td
                  colSpan={columns.length + (onSelect ? 1 : 0)}
                  className={
                    "items-center pl-2 py-2 pr-0 text-slate-500 dark:text-slate-400 " +
                    (scrollable
                      ? " sticky bottom-0 bg-slate-50 dark:bg-slate-800 z-10 "
                      : "")
                  }
                >
                  <TablePagination
                    pagination={pagination}
                    dataLength={data.length}
                    onChangePage={onChangePage}
                    onChangePageSize={scrollable ? undefined : onChangePageSize}
                    loading={loading}
                  />
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
