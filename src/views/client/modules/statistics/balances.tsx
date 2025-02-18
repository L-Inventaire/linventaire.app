import Link from "@atoms/link";
import { getContactName } from "@features/contacts/types/types";
import { getRoute, ROUTES } from "@features/routes";
import { useDashboardBalances } from "@features/statistics/hooks";
import { DashboardBalances } from "@features/statistics/types";
import { formatAmount } from "@features/utils/format/strings";
import { Table } from "@molecules/table";
import { Spinner } from "@radix-ui/themes";
import { twMerge } from "tailwind-merge";

export const BalancesPage = ({ type }: { type: "client" | "supplier" }) => {
  const res = useDashboardBalances(type);
  if (!res.data) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner />
      </div>
    );
  }

  const getLink = (
    _contact?: string,
    _laterFrom?: number,
    _laterTo?: number
  ) => {
    const query = ""; // TODO
    return (
      getRoute(ROUTES.Invoices, {
        type:
          type === "client"
            ? "invoices"
            : "supplier_invoices+supplier_credit_notes",
      }) +
      "?" +
      query
    );
  };

  return (
    <Table
      columns={[
        {
          title: "Client",
          thClassName: "w-1/4",
          render: (row: DashboardBalances[0]) => (
            <Link
              noColor
              className={twMerge("hover:underline cursor-pointer")}
              href={getLink(row.id)}
            >
              {row.contact ? getContactName(row.contact) : "Inconnu"}
            </Link>
          ),
        },
        {
          title: (
            <Link
              noColor
              className={twMerge("hover:underline cursor-pointer")}
              href={getLink(undefined, -1)}
            >
              Non échus
            </Link>
          ),
          cellClassName: "justify-end",
          headClassName: "justify-end",
          render: (row: DashboardBalances[0]) => (
            <Link
              noColor
              className={twMerge("hover:underline cursor-pointer")}
              href={getLink(row.id, undefined, 0)}
            >
              {formatAmount(row.total.total - row.late.total)}
            </Link>
          ),
        },
        {
          title: (
            <Link
              noColor
              className={twMerge("hover:underline cursor-pointer")}
              href={getLink(undefined, 0, 30)}
            >
              1-30
            </Link>
          ),
          cellClassName: "justify-end",
          headClassName: "justify-end",
          render: (row: DashboardBalances[0]) => (
            <Link
              noColor
              className={twMerge("hover:underline cursor-pointer")}
              href={getLink(row.id, 0, 30)}
            >
              {formatAmount(row.d30.total)}
            </Link>
          ),
        },
        {
          title: (
            <Link
              noColor
              className={twMerge("hover:underline cursor-pointer")}
              href={getLink(undefined, 31, 60)}
            >
              31-60
            </Link>
          ),
          cellClassName: "justify-end",
          headClassName: "justify-end",
          render: (row: DashboardBalances[0]) => (
            <Link
              noColor
              className={twMerge("hover:underline cursor-pointer")}
              href={getLink(undefined, 31, 60)}
            >
              {formatAmount(row.d60.total)}
            </Link>
          ),
        },
        {
          title: (
            <Link
              noColor
              className={twMerge("hover:underline cursor-pointer")}
              href={getLink(undefined, 61, 90)}
            >
              61-90
            </Link>
          ),
          cellClassName: "justify-end",
          headClassName: "justify-end",
          render: (row: DashboardBalances[0]) => (
            <Link
              noColor
              className={twMerge("hover:underline cursor-pointer")}
              href={getLink(row.id, 61, 90)}
            >
              {formatAmount(row.d90.total)}
            </Link>
          ),
        },
        {
          title: (
            <Link
              noColor
              className={twMerge("hover:underline cursor-pointer")}
              href={getLink(undefined, 91, 120)}
            >
              91-120
            </Link>
          ),
          cellClassName: "justify-end",
          headClassName: "justify-end",
          render: (row: DashboardBalances[0]) => (
            <Link
              noColor
              className={twMerge("hover:underline cursor-pointer")}
              href={getLink(row.id, 91, 120)}
            >
              {formatAmount(row.d120.total)}
            </Link>
          ),
        },
        {
          title: (
            <Link
              noColor
              className={twMerge("hover:underline cursor-pointer")}
              href={getLink(undefined, 120)}
            >
              120+
            </Link>
          ),
          cellClassName: "justify-end",
          headClassName: "justify-end",
          render: (row: DashboardBalances[0]) => (
            <Link
              noColor
              className={twMerge("hover:underline cursor-pointer")}
              href={getLink(row.id, 120)}
            >
              {formatAmount(row.d120plus.total)}
            </Link>
          ),
        },
        {
          title: (
            <Link
              noColor
              className={twMerge("hover:underline cursor-pointer")}
              href={getLink(undefined)}
            >
              Total
            </Link>
          ),
          cellClassName: "justify-end",
          headClassName: "justify-end",
          render: (row: DashboardBalances[0]) => (
            <Link
              noColor
              className={twMerge("hover:underline cursor-pointer")}
              href={getLink(row.id)}
            >
              <b>{formatAmount(row.total.total)}</b>
            </Link>
          ),
        },
      ]}
      data={res.data || []}
      showPagination={false}
    />
  );
};
