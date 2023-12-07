import { Column, Pagination, RenderedTable } from "./table";
import "./index.scss";
import { ReactNode, useCallback, useEffect, useState } from "react";

type PropsType<T> = {
  columns: Column<T>[];
  data: T[];
  scrollable?: boolean;
  rowIndex?: string;
  total?: number;

  cellClassName?: (row: T) => string;
  className?: string;
  loading?: boolean;
  onRequestData?: (pagination: Pagination) => Promise<void>;
  onClick?: (item: T) => void;
  onSelect?:
    | {
        icon?: (props: any) => JSX.Element;
        label: string | ReactNode;
        callback: (items: T[]) => void;
      }[]
    | ((items: T[]) => void);
  showPagination?: boolean;
  initialPagination?: Pick<
    Pagination,
    "order" | "orderBy" | "page" | "perPage"
  >;
};

export function Table<T>({
  columns,
  data,
  rowIndex,
  total,
  scrollable,
  showPagination,
  initialPagination,
  onRequestData,
  onClick,
  onSelect,
  loading,
  cellClassName,
  className,
}: PropsType<T>) {
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
      columns={columns}
      data={data}
      rowIndex={rowIndex}
      pagination={showPagination !== false ? pagination : undefined}
      scrollable={scrollable}
      onClick={onClick}
      onSelect={onSelect}
      loading={loading || internalLoading}
      cellClassName={cellClassName}
      className={className}
      onChangeOrder={(columnIndex, direction) => {
        setPagination({
          ...pagination,
          orderBy: columnIndex,
          order: direction,
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
    />
  );
}
