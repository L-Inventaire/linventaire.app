import _ from "lodash";
import { twMerge } from "tailwind-merge";

export type TableRowProps<T> = {
  data: T;
  onClick?: (row: any, e: any) => void;
  header?: boolean;
} & Omit<React.HTMLAttributes<HTMLTableRowElement>, "onClick">;

export function TableRow<T>({
  data,
  onClick,
  children,
  header = false,
  ...props
}: TableRowProps<T>) {
  return (
    <tr
      {..._.omit(props, "className", "onClick")}
      onClick={(e) => onClick && onClick(data, e as any)}
      className={twMerge(
        !header && "group/row",
        header &&
          "bg-slate-50 border-b bg-opacity-50 dark:bg-slate-800 dark:border-slate-700",
        onClick && "cursor-pointer",
        props.className
      )}
    >
      {children}
    </tr>
  );
}
