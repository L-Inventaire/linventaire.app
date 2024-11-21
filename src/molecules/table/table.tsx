import { Button } from "@atoms/button/button";
import { Checkbox } from "@atoms/input/input-checkbox";
import Select from "@atoms/input/input-select";
import { DelayedLoader } from "@atoms/loader";
import { Modal } from "@atoms/modal/modal";
import { Base, BaseSmall, Info } from "@atoms/text";
import { useShortcuts } from "@features/utils/shortcuts";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/16/solid";
import { ArrowDownTrayIcon, CogIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@radix-ui/themes";
import _ from "lodash";
import { ReactNode, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";
import { TableExportModal } from "./export-modal";
import { TableOptionsModal } from "./options-modal";
import { TablePagination, TablePaginationSimple } from "./pagination";

export type RenderOptions = {};

export type Column<T> = {
  id?: string;
  title?: string | ReactNode;
  className?: string;
  thClassName?: string;
  headClassName?: string;
  cellClassName?: string;
  orderable?: boolean;
  hidden?: boolean;
  render: (item: T, options: RenderOptions) => string | ReactNode;
};

export type Pagination = {
  total: number;
  page: number;
  perPage: number;
  orderBy?: number;
  order?: "ASC" | "DESC";
};

type PropsType<T> = {
  name?: string;
  grid?: boolean;
  columns: Column<T>[];
  data: T[];
  rowIndex?: string;
  cellClassName?: (row: T) => string;
  className?: string;
  showPagination?: false | "simple" | "full" | true;
  pagination?: Pagination;
  scrollable?: boolean;
  loading?: boolean;
  checkboxAlwaysVisible?: boolean;
  groupBy?: string | ((item: T) => string);
  groupByRender?: (item: T) => ReactNode;
  onSelectedActionsClick?: () => void;
  onSelect?:
    | {
        icon?: (props: any) => JSX.Element;
        label: string | ReactNode;
        type?: "danger" | "menu";
        callback: (items: T[]) => void;
      }[]
    | ((items: T[]) => void);
  selection?: T[];
  onClick?: (item: T, e: MouseEvent) => void;
  onChangeOrder?: (columnIndex: number, direction: "ASC" | "DESC") => void;
  onChangePage?: (page: number) => void;
  onChangePageSize?: (size: number) => void;
  onFetchExportData?: (pagination: Pagination) => Promise<T[]>;
};

const defaultCellClassName = ({
  selected,
  rowOdd,
  colFirst,
  colLast,
  className,
}: {
  selected: boolean;
  rowFirst: boolean;
  rowLast: boolean;
  rowOdd?: boolean;
  colFirst: boolean;
  colLast: boolean;
  className?: string;
}) => {
  return twMerge(
    "h-full w-full flex items-center min-h-12 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800",
    colFirst && "pl-1",
    colLast && "pr-1",
    selected
      ? " bg-opacity-20 dark:bg-opacity-20 bg-slate-500 dark:bg-slate-500 group-hover/row:bg-opacity-15 dark:group-hover/row:bg-opacity-15"
      : rowOdd
      ? "dark:bg-opacity-15 bg-opacity-15 group-hover/row:bg-opacity-0 dark:group-hover/row:bg-opacity-0"
      : "dark:bg-opacity-50 bg-opacity-50 group-hover/row:bg-opacity-25 dark:group-hover/row:bg-opacity-25",
    className || ""
  );
};

export function RenderedTable<T>({
  name,
  columns,
  data,
  rowIndex,
  showPagination,
  pagination,
  loading,
  scrollable,
  onSelectedActionsClick,
  onSelect,
  selection,
  onClick,
  onChangeOrder,
  onChangePage,
  onChangePageSize,
  checkboxAlwaysVisible,
  grid,
  cellClassName,
  className,
  onFetchExportData,
  ...props
}: PropsType<T>) {
  const [_selected, _setSelected] = useState<T[]>(selection || []);
  const parentRef = useRef<HTMLDivElement>(null);
  const [exportModal, setExportModal] = useState(false);
  const [optionsModal, setOptionsModal] = useState(false);

  const isControlled = selection !== undefined;

  const selected = isControlled ? selection : _selected;
  const setSelected = (event: T[]) => {
    if (onSelect && typeof onSelect === "function") onSelect(event);
    if (!isControlled) {
      _setSelected(event);
    }
  };

  useEffect(() => {
    setSelected(selection || []);
  }, [selection, data.length, pagination?.page, pagination?.perPage]);

  const { t } = useTranslation();

  useShortcuts(
    ["cmd+a"],
    () => {
      if (data.length === selected.length) setSelected([]);
      else setSelected(data);
    },
    [data.length, selected.length]
  );

  const onClickCheckbox = (row: T, a: boolean, e: any) => {
    // Unselect all selected text
    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
    //Code to manage shift click range
    if ((e.shiftKey || e.ctrlKey) && selected.length > 0) {
      let anchor = selected[selected.length - 1];
      let start = false;
      let newSelection: T[] = [];
      for (const d of data) {
        if (
          (d as any)[rowIndex || "id"] === (anchor as any)[rowIndex || "id"] ||
          (d as any)[rowIndex || "id"] === (row as any)[rowIndex || "id"]
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
              (s) =>
                !newSelection
                  .map((a) => (a as any)[rowIndex || "id"])
                  .includes((s as any)[rowIndex || "id"])
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
          _.uniqBy([...selected, row], (s) => (s as any)[rowIndex || "id"])
        );
      } else {
        setSelected(
          selected.filter(
            (s) =>
              (s as any)[rowIndex || "id"] !== (row as any)[rowIndex || "id"]
          )
        );
      }
    }
  };

  return (
    <div
      ref={parentRef}
      className={
        "not-prose text-left border-slate-200 dark:border-slate-700 relative overflow-auto " +
        (className || "")
      }
    >
      <Modal open={exportModal} onClose={() => setExportModal(false)}>
        <TableExportModal
          tableName={name}
          fetchData={async (pagination: Pagination) =>
            await onFetchExportData!(pagination)
          }
          pagination={pagination}
          onClose={() => setExportModal(false)}
        />
      </Modal>

      <Modal open={optionsModal} onClose={() => setOptionsModal(false)}>
        <TableOptionsModal />
      </Modal>

      <div
        className={
          "relative print:overflow-none " + (scrollable ? "h-full " : "")
        }
        style={{
          minHeight: 40,
        }}
      >
        {loading && (
          <div className="absolute m-auto left-0 top-0 right-0 bottom-0 w-6 h-6 text-center z-10">
            <DelayedLoader color="text-slate-500" />
          </div>
        )}

        {grid && columns.filter((a) => !a.hidden).find((c) => c.orderable) && (
          <div className={"float-left flex flex-row "}>
            <Select
              size="md"
              className="grow w-full my-2 mr-2"
              onChange={(e) => {
                if (onChangeOrder) {
                  onChangeOrder(parseInt(e.target.value), "ASC");

                  // go back to first selection in select
                  e.target.selectedIndex = 0;
                }
              }}
            >
              <option value="">
                {"Trier par "}
                {columns[pagination?.orderBy as number]?.title ?? "..."}
              </option>
              {columns
                .filter((a) => !a.hidden)
                .map((c, i) => (
                  <option key={i} value={i}>
                    {c.title}
                  </option>
                ))}
            </Select>
            <Select
              size="md"
              className="shrink-0 !w-auto -ml-px my-2"
              onChange={(e) => {
                if (onChangeOrder)
                  onChangeOrder(
                    pagination?.orderBy || 0,
                    e.target.value as "ASC" | "DESC"
                  );
              }}
            >
              <option value={"ASC"}>Croissant</option>
              <option value={"DESC"}>Décroissant</option>
            </Select>
          </div>
        )}

        {onFetchExportData && (
          <div className="float-right ml-2">
            <Button
              className="my-2"
              theme="default"
              size="md"
              icon={(p) => <ArrowDownTrayIcon {...p} />}
              onClick={() => setExportModal(true)}
            >
              Export
            </Button>
          </div>
        )}

        {
          // TODO add options to change columns order
          false && !grid && (
            <div className="float-right ml-2">
              <Button
                className="my-2"
                theme="default"
                size="md"
                icon={(p) => <CogIcon {...p} />}
                onClick={() => setOptionsModal(true)}
              >
                Options
              </Button>
            </div>
          )
        }

        <table
          className={
            "relative z-0 border-collapse table-fixed w-auto min-w-full " +
            (loading ? " opacity-75 animate-pulse " : "") +
            (scrollable ? " scrollable h-full " : "")
          }
        >
          {!grid &&
            columns
              .filter((a) => !a.hidden)
              .map((c) => c.title || "")
              .join("") && (
              <thead>
                <tr className="bg-slate-50 border-b bg-opacity-50 dark:bg-slate-800 dark:border-slate-700">
                  {onSelect && (
                    <th
                      className={
                        "w-8 shrink-0 relative text-center pl-1 relative" +
                        (scrollable ? " sticky top-0 " : "")
                      }
                    >
                      <BaseSmall className="opacity-50">#</BaseSmall>

                      {!!onSelectedActionsClick && selected.length > 0 && (
                        <div className="absolute top-0.5 left-2 z-10">
                          <Button
                            size="xs"
                            onClick={() => {
                              onSelectedActionsClick();
                            }}
                          >
                            <span>Actions</span>{" "}
                            <ChevronDownIcon className="h-2 w-2 ml-2" />
                          </Button>
                        </div>
                      )}
                    </th>
                  )}
                  {columns
                    .filter((a) => !a.hidden)
                    .map((column, i) => (
                      <th
                        key={i}
                        className={twMerge(
                          "font-medium px-1 py-1 opacity-50 " +
                            (column.orderable
                              ? "cursor-pointer hover:bg-opacity-75 "
                              : "") +
                            (scrollable ? " sticky top-0 z-10 " : "") +
                            (column.thClassName || "")
                        )}
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
                          className={twMerge(
                            "items-center flex text-slate-500 table-hover-sort-container whitespace-nowrap  " +
                              (column.headClassName || ""),
                            i === columns.length - 1 ? "pr-1" : ""
                          )}
                        >
                          <BaseSmall noColor={pagination?.orderBy === i}>
                            {column.title}
                          </BaseSmall>
                          {column.orderable && (
                            <div className="w-8 flex items-center ml-1">
                              {pagination?.orderBy === i &&
                                pagination.order === "DESC" && (
                                  <ArrowUpIcon className="h-4 w-4 text-slate-500 inline" />
                                )}
                              {pagination?.orderBy === i &&
                                pagination.order !== "DESC" && (
                                  <ArrowDownIcon className="h-4 w-4 text-slate-500 inline" />
                                )}
                              {pagination?.orderBy !== i &&
                                column.orderable && (
                                  <ArrowDownIcon className="table-hover-sort h-4 w-4 text-slate-500 opacity-50 inline" />
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
            {data.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={
                    columns.filter((a) => !a.hidden).length + (onSelect ? 1 : 0)
                  }
                >
                  <div className="p-4 text-center">
                    <Info>{t("general.tables.empty")}</Info>
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
              const iFirst = i === 0;
              const iLast = i === data.length - 1;

              const getGroupByKey = (item?: T) => {
                if (typeof props.groupBy === "string") {
                  return _.get(item, props.groupBy);
                }
                return props.groupBy && item ? props.groupBy(item) : "";
              };

              return (
                <>
                  {props.groupBy &&
                    getGroupByKey(data?.[i]) !==
                      getGroupByKey(data?.[i - 1]) && (
                      <tr>
                        <td
                          colSpan={columns.length + 1}
                          className="bg-slate-100 border-b bg-opacity-75 border-slate-100 dark:bg-slate-800 dark:border-slate-700 pl-6 py-1"
                        >
                          {props.groupByRender?.(row) || getGroupByKey(row)}
                        </td>
                      </tr>
                    )}

                  <tr
                    key={i}
                    onClick={(e) => onClick && onClick(row, e as any)}
                    className={twMerge(
                      "group/row",
                      onClick && "cursor-pointer"
                    )}
                  >
                    {onSelect && (
                      <td
                        className="w-8 m-0 p-0 height-table-hack overflow-hidden group/checkbox shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          className={defaultCellClassName({
                            selected: isSelected,
                            rowFirst: iFirst,
                            rowLast: iLast,
                            rowOdd: i % 2 === 0,
                            colFirst: true,
                            colLast: false,
                            className: "pl-0 flex justify-center items-center",
                          })}
                        >
                          <Checkbox
                            className={twMerge(
                              "ml-1 group-hover/checkbox:opacity-100 opacity-0",
                              checkboxAlwaysVisible && "opacity-100",
                              isSelected && "opacity-100"
                            )}
                            size="sm"
                            value={isSelected}
                            onChange={(a, e) => onClickCheckbox(row, a, e)}
                          />
                        </div>
                      </td>
                    )}
                    {columns
                      .filter((a) => !a.hidden)
                      .map((cell, j) => {
                        const jFirst = j === 0 && !onSelect;
                        const jLast =
                          j === columns.filter((a) => !a.hidden).length - 1;
                        return (
                          <td
                            key={j}
                            className={twMerge(
                              "m-0 p-0 height-table-hack overflow-hidden",
                              !cell.title && cell.thClassName
                            )}
                          >
                            <div
                              className={defaultCellClassName({
                                selected: isSelected,
                                rowFirst: iFirst,
                                rowLast: iLast,
                                rowOdd: i % 2 === 0,
                                colFirst: jFirst,
                                colLast: jLast,
                                className: cell.className || "",
                              })}
                            >
                              <Base
                                className={
                                  (jFirst ? "pl-2 " : "") +
                                  (jLast ? "pr-2 " : "") +
                                  "w-full py-1 px-1 inline-flex items-center h-full " +
                                  (cell.cellClassName || "") +
                                  " " +
                                  (cellClassName?.(row) || "")
                                }
                              >
                                {cell.render(row, { responsive: false })}
                              </Base>
                            </div>
                          </td>
                        );
                      })}
                  </tr>
                </>
              );
            })}
          </tbody>
          {!!pagination && showPagination && (!loading || !!data.length) && (
            <tfoot>
              <tr>
                <td
                  colSpan={
                    columns.filter((a) => !a.hidden).length + (onSelect ? 1 : 0)
                  }
                  className={
                    "items-center py-3 px-3 text-slate-500 dark:text-slate-400 " +
                    (scrollable ? " sticky bottom-0 z-10 " : "")
                  }
                >
                  {showPagination === "full" ? (
                    <TablePagination
                      pagination={pagination}
                      dataLength={data.length}
                      onChangePage={onChangePage}
                      onChangePageSize={
                        scrollable ? undefined : onChangePageSize
                      }
                      loading={loading}
                    />
                  ) : (
                    <TablePaginationSimple
                      pagination={pagination}
                      dataLength={data.length}
                      onChangePage={onChangePage}
                      loading={loading}
                    />
                  )}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
