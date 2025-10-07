import { Button } from "@atoms/button/button";
import { Checkbox } from "@atoms/input/input-checkbox";
import { DelayedLoader } from "@atoms/loader";
import { Modal } from "@atoms/modal/modal";
import { BaseSmall, Info } from "@atoms/text";
import { useShortcuts } from "@features/utils/shortcuts";
import { ChevronUpIcon, CogIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@radix-ui/themes";
import _ from "lodash";
import { Fragment, ReactNode, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";
import { TableExportModal } from "./export-modal";
import { TableOptionsModal } from "./options-modal";
import { TablePagination, TablePaginationSimple } from "./pagination";
import { TableCell, TableCellValue } from "./table-cell";
import { TableCellHeader } from "./table-cell-header";

export type RenderOptions = {
  [key: string]: any;
};

export type Column<T> = {
  id?: string;
  title?: string | ReactNode;
  className?: string;
  thClassName?: string;
  headClassName?: string;
  cellClassName?: string;
  orderBy?: string;
  hidden?: boolean;
  render: (item: T, options: RenderOptions) => string | ReactNode;
};

export type Pagination = {
  total: number;
  page: number;
  perPage: number;
  orderBy?: string;
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
  groupByRender?: (
    item: T,
    i: number,
    renderClosable?: () => ReactNode,
    toggleGroup?: () => void
  ) => ReactNode;
  groupByClosable?: boolean;
  groupByRenderBlank?: boolean;
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
  onChangeOrder?: (orderBy: string, direction: "ASC" | "DESC") => void;
  onChangePage?: (page: number) => void;
  onChangePageSize?: (size: number) => void;
  onFetchExportData?: (
    pagination: Pick<Pagination, "page" | "perPage">
  ) => Promise<T[]>;
};

export const defaultCellClassName = ({
  selected,
  rowOdd,
  first,
  last,
  className,
}: {
  selected: boolean;
  rowOdd?: boolean;
  first?: boolean;
  last?: boolean;
  className?: string;
}) => {
  return twMerge(
    "h-full w-full flex items-center min-h-12 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800",
    first && "pl-1",
    last && "pr-1",
    selected
      ? " bg-opacity-20 dark:bg-opacity-20 bg-slate-500 dark:bg-slate-500 group-hover/row:bg-opacity-15 dark:group-hover/row:bg-opacity-15"
      : rowOdd
      ? "dark:bg-opacity-15 bg-opacity-15 group-hover/row:bg-opacity-0 dark:group-hover/row:bg-opacity-0"
      : "dark:bg-opacity-50 bg-opacity-50 group-hover/row:bg-opacity-25 dark:group-hover/row:bg-opacity-25",
    className
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
  groupByRenderBlank,
  className,
  cellClassName,
  onFetchExportData,
  ...props
}: PropsType<T>) {
  const [_selected, _setSelected] = useState<T[]>(selection || []);
  const parentRef = useRef<HTMLDivElement>(null);
  const [exportModal, setExportModal] = useState(false);
  const [optionsModal, setOptionsModal] = useState(false);

  const getGroupByKey = (item?: T) => {
    if (typeof props.groupBy === "string") {
      return _.get(item, props.groupBy);
    }
    return props.groupBy && item ? props.groupBy(item) : "";
  };

  const [groupByOpen, setGroupByOpen] = useState<{
    [key: string]: boolean;
  }>(
    props.groupBy
      ? data
          .map((row) => getGroupByKey(row))
          .reduce((acc, key) => ({ ...acc, [key]: true }), {})
      : {}
  );

  useEffect(() => {
    setGroupByOpen(
      props.groupBy
        ? data
            .map((row) => getGroupByKey(row))
            .reduce(
              (acc, key) => ({
                ...acc,
                [key]: false,
              }),
              {}
            )
        : {}
    );
  }, []);

  useEffect(() => {
    setGroupByOpen((prevData) =>
      props.groupBy
        ? data
            .map((row) => getGroupByKey(row))
            .reduce(
              (acc, key) => ({
                ...acc,
                [key]: prevData[key] ? prevData[key] : false,
              }),
              {}
            )
        : {}
    );
  }, [props.groupBy, data]);

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
      const anchor = selected[selected.length - 1];
      let start = false;
      const newSelection: T[] = [];
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
          fetchData={async (pagination) => await onFetchExportData!(pagination)}
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
          className={twMerge(
            "relative z-0 border-collapse table-fixed w-auto min-w-full",
            loading && " opacity-50 animate-pulse",
            scrollable && " scrollable h-full"
          )}
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
                        "w-8 shrink-0 relative text-center pl-1" +
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
                            data-tooltip={"Actions groupées"}
                            shortcut={["cmd+k"]}
                          >
                            <div className="flex items-center">
                              <span>Actions</span>{" "}
                              <ChevronDownIcon className="h-2 w-2 ml-2" />
                            </div>
                          </Button>
                        </div>
                      )}
                    </th>
                  )}
                  {columns
                    .filter((a) => !a.hidden)
                    .map((column, i) => (
                      <TableCellHeader
                        index={i}
                        key={i + "-" + column.id}
                        columns={columns}
                        column={column}
                        scrollable={scrollable}
                        onChangeOrder={onChangeOrder}
                        pagination={pagination}
                      />
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
              const iFirst = i === 0 && !props?.groupByClosable;
              const iLast = i === data.length - 1;

              const isGroupBy =
                props.groupBy &&
                getGroupByKey(data?.[i]) !== getGroupByKey(data?.[i - 1]);

              const toggleGroup = isGroupBy
                ? () => {
                    setGroupByOpen((open) => ({
                      ...open,
                      [getGroupByKey(data?.[i])]:
                        !open[getGroupByKey(data?.[i])],
                    }));
                  }
                : () => {};

              const renderGroupByToggle = () => {
                return (
                  <TableCell
                    className={twMerge(
                      "cursor-pointer",
                      cellClassName?.(row) || ""
                    )}
                    odd={!!(i % 2)}
                    first
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      toggleGroup();
                    }}
                  >
                    {groupByOpen[getGroupByKey(data?.[i])] && (
                      <ChevronUpIcon className="w-4" />
                    )}
                    {!groupByOpen[getGroupByKey(data?.[i])] && (
                      <ChevronDownIcon className="w-4" />
                    )}
                  </TableCell>
                );
              };

              return (
                <Fragment key={i}>
                  {isGroupBy && (
                    <>
                      {!groupByRenderBlank ? (
                        <tr>
                          {props?.groupByClosable && renderGroupByToggle()}
                          <td
                            colSpan={columns.length + 1}
                            className="bg-slate-100 border-b bg-opacity-75 border-slate-100 dark:bg-slate-800 dark:border-slate-700 pl-6 py-1"
                          >
                            {props.groupByRender?.(
                              row,
                              i,
                              renderGroupByToggle,
                              toggleGroup
                            ) || getGroupByKey(row)}
                          </td>
                        </tr>
                      ) : (
                        props.groupByRender?.(
                          row,
                          i,
                          renderGroupByToggle,
                          toggleGroup
                        ) || getGroupByKey(row)
                      )}
                    </>
                  )}

                  {(!props.groupByClosable ||
                    groupByOpen[getGroupByKey(data?.[i])]) && (
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
                              first: iFirst,
                              last: iLast,
                              rowOdd: (i - 1) % 2 === 0,
                              className:
                                "pl-0 flex justify-center items-center",
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
                          return (
                            <TableCellValue<T>
                              i={i}
                              j={j}
                              key={i + "-" + j}
                              row={row}
                              columns={columns}
                              cell={cell}
                              data={data}
                              className={
                                (cell.cellClassName || "") +
                                " " +
                                (cellClassName?.(row) || "")
                              }
                            />
                          );
                        })}
                    </tr>
                  )}
                </Fragment>
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
                      onChangePage={(...a) => {
                        onChangePage?.(...a);
                        // Make sure top of parentRef is scrolled into view
                        if (parentRef.current) {
                          parentRef.current.parentElement?.scrollIntoView?.({
                            behavior: "instant",
                            block: "start",
                          });
                        }
                      }}
                      onChangePageSize={
                        scrollable ? undefined : onChangePageSize
                      }
                      loading={loading}
                      onExport={
                        onFetchExportData
                          ? () => setExportModal(true)
                          : undefined
                      }
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
