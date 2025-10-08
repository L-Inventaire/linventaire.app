import { Base } from "@atoms/text";
import { twMerge } from "tailwind-merge";
import { Column, defaultCellClassName } from "./table";
import _ from "lodash";

export type TableCellValueProps<T> = {
  columns: Column<T>[];
  data: T[];
  row: T;
  cell: Column<T>;
  cellClassName?: (row: T) => string;
  isSelected?: boolean;
  i: number;
  j: number;
} & React.HTMLAttributes<HTMLTableHeaderCellElement>;

export type TableCellProps = {
  odd?: boolean;
  first?: boolean;
  last?: boolean;
  isSelected?: boolean;
} & React.HTMLAttributes<HTMLTableHeaderCellElement>;

export function TableCell({
  first = false,
  last = false,
  odd = false,
  isSelected = false,
  ...props
}: TableCellProps) {
  return (
    <td
      className={twMerge(
        "m-0 p-0 height-table-hack overflow-hidden",
        props.className
      )}
      {..._.omit(props, "className")}
    >
      <div
        className={defaultCellClassName({
          selected: isSelected,
          rowOdd: odd,
          first,
          last,
          className: props.className,
        })}
      >
        <Base
          className={twMerge(
            "w-full py-1 px-1 inline-flex items-center h-full",
            props.className
          )}
        >
          {props.children}
        </Base>
      </div>
    </td>
  );
}

export function TableCellValue<T>({
  cell,
  row,
  columns,
  i,
  j,
  ...props
}: TableCellValueProps<T>) {
  const jFirst = j === 0;
  const jLast = j === columns?.length - 1;

  return (
    <TableCell odd={!!(i % 2)} first={jFirst} last={jLast} {...props}>
      {cell.render(row, { responsive: false })}
    </TableCell>
  );
}
