import _ from "lodash";
import { ReactNode, useCallback, useEffect, useState } from "react";
import "./index.scss";
import { Column, Pagination, RenderOptions, RenderedTable } from "./table";
import { twMerge } from "tailwind-merge";

export type TablePropsType<T> = {
  name?: string;
  columns: Column<T>[];
  data: T[];
  scrollable?: boolean;
  rowIndex?: string;
  total?: number;

  checkboxAlwaysVisible?: boolean;
  grid?: boolean;
  cellClassName?: (row: T) => string;
  className?: string;
  border?: boolean;
  loading?: boolean;
  onRequestData?: (pagination: Pagination) => Promise<void>;
  onFetchExportData?: (pagination: Pagination) => Promise<any[]>;
  onClick?: (item: T, e: MouseEvent) => void;
  onSelect?:
    | {
        icon?: (props: any) => JSX.Element;
        label: string | ReactNode;
        type?: "danger" | "menu";
        callback: (items: T[]) => void;
      }[]
    | ((items: T[]) => void);
  selection?: T[];
  groupBy?: string | ((item: T) => string);
  groupByRender?: (item: T) => ReactNode;
  showPagination?: false | "simple" | "full" | true;
  initialPagination?: Pick<
    Pagination,
    "order" | "orderBy" | "page" | "perPage"
  >;
};

export function Grid<T>(
  props: Omit<TablePropsType<T>, "grid" | "columns"> & {
    render: (item: T, options?: RenderOptions) => string | ReactNode;
    orderables?: string[];
  }
) {
  return (
    <Table
      grid
      {..._.omit(props, "render")}
      columns={[
        {
          orderable: !!props.orderables?.length,
          title: props.orderables?.[0],
          render: props.render,
        },
        ...(props.orderables || []).slice(1).map((key) => ({
          orderable: true,
          title: key,
          render: () => "",
        })),
      ]}
    />
  );
}

export function Table<T>({
  border,
  name,
  columns,
  data,
  rowIndex,
  total,
  scrollable,
  showPagination,
  initialPagination,
  onRequestData,
  onFetchExportData,
  checkboxAlwaysVisible,
  onClick,
  onSelect,
  selection,
  loading,
  grid,
  cellClassName,
  className,
  ...props
}: TablePropsType<T>) {
  const [pagination, setPagination] = useState<Pagination>({
    total: total || 0,
    page: initialPagination?.page || 1,
    perPage: initialPagination?.perPage || 10,
    orderBy: initialPagination?.orderBy,
    order: initialPagination?.order,
  });
  const [internalLoading, setLoading] = useState(false);

  const resolve = useCallback(async () => {
    setLoading(true);
    if (onRequestData) await onRequestData(pagination);
    setLoading(false);
  }, [onRequestData, setLoading, pagination]);

  /* react-hooks/exhaustive-deps issues */
  (useEffect as any)(() => {
    if (total !== pagination.total)
      setPagination({
        ...pagination,
        total: total || 0,
      });
  }, [total, setPagination]);

  /* react-hooks/exhaustive-deps issues */
  (useEffect as any)(() => {
    resolve();
  }, [
    pagination.perPage,
    pagination.page,
    pagination.order,
    pagination.orderBy,
  ]);

  return (
    <RenderedTable
      name={name}
      columns={columns}
      data={data}
      rowIndex={rowIndex}
      showPagination={showPagination}
      pagination={pagination}
      scrollable={scrollable}
      onClick={onClick}
      onSelect={onSelect}
      selection={selection}
      loading={loading || internalLoading}
      grid={grid}
      cellClassName={cellClassName}
      className={twMerge(
        border && "border border-slate-50 dark:border-slate-700 rounded-md ",
        className
      )}
      onFetchExportData={onFetchExportData}
      checkboxAlwaysVisible={checkboxAlwaysVisible}
      onChangeOrder={(columnIndex, direction) => {
        setPagination({
          ...pagination,
          orderBy: columnIndex,
          order: direction,
          page: 1,
        });
      }}
      onChangePage={(page) => {
        setPagination({
          ...pagination,
          page,
        });
      }}
      onChangePageSize={(size) => {
        setPagination({
          ...pagination,
          perPage: size,
        });
      }}
      {...props}
    />
  );
}
