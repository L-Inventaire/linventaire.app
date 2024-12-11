import { Base } from "@atoms/text";
import { twMerge } from "tailwind-merge";
import { Column, defaultCellClassName } from "./table";

export type TableCellProps<T> = {
  columns: Column<T>[];
  data: T[];
  row: T;
  cell: Column<T>;
  cellClassName?: (row: T) => string;
  isSelected?: boolean;
  i: number;
  j: number;
} & React.HTMLAttributes<HTMLTableHeaderCellElement>;

export function TableCell<T>({
  cell,
  row,
  cellClassName,
  isSelected = false,
  onSelect,
  data,
  columns,
  i,
  j,
  ...props
}: TableCellProps<T>) {
  const iFirst = i === 0;
  const iLast = i === data.length - 1;
  const jFirst = j === 0 && !onSelect;
  const jLast = j === columns.filter((a) => !a.hidden).length - 1;

  return (
    <td
      className={twMerge(
        "m-0 p-0 height-table-hack overflow-hidden",
        !cell.title && cell.thClassName
      )}
      {...props}
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
          className={twMerge(
            "w-full py-1 px-1 inline-flex items-center h-full",
            jFirst && "pl-2",
            jLast && "pr-2",
            cellClassName?.(row)
          )}
        >
          {cell.render(row, { responsive: false })}
        </Base>
      </div>
    </td>
  );
}
