import Link from "@atoms/link";
import { getContactName } from "@features/contacts/types/types";
import { getRoute, ROUTES } from "@features/routes";
import { useDashboardBalances } from "@features/statistics/hooks";
import { DashboardBalances } from "@features/statistics/types";
import { formatAmount } from "@features/utils/format/strings";
import { Table } from "@molecules/table";
import { Spinner } from "@radix-ui/themes";
import _ from "lodash";
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

  const getLink = (contact?: string, laterFrom?: number, laterTo?: number) => {
    const laterFromDate =
      laterFrom !== undefined
        ? new Date(Date.now() + laterFrom * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]
        : "";
    const laterToDate =
      laterTo !== undefined
        ? new Date(Date.now() + laterTo * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]
        : "";
    const q = [
      `!state:"closed"`,
      contact !== undefined
        ? `${type === "client" ? "client" : "supplier"}:${contact}`
        : "",
      laterFrom || laterTo
        ? `payment_information.computed_date:${`${
            laterFromDate || "1900-01-01"
          }->${laterToDate || new Date().toISOString().split("T")[0]}`}`
        : "",
    ]
      .filter(Boolean)
      .join(" ");
    const query = [`q=${encodeURIComponent(q)}`].filter(Boolean).join("&");
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

  const total = {
    id: "total",
    contact: {
      business_name: "(Total)",
    },
    total: {
      total: res.data.reduce((acc, item) => acc + item.total.total, 0),
    },
    late: {
      total: res.data.reduce((acc, item) => acc + item.late.total, 0),
    },
    d30: {
      total: res.data.reduce((acc, item) => acc + item.d30.total, 0),
    },
    d60: {
      total: res.data.reduce((acc, item) => acc + item.d60.total, 0),
    },
    d90: {
      total: res.data.reduce((acc, item) => acc + item.d90.total, 0),
    },
    d120: {
      total: res.data.reduce((acc, item) => acc + item.d120.total, 0),
    },
    d120plus: {
      total: res.data.reduce((acc, item) => acc + item.d120plus.total, 0),
    },
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
              href={getLink(undefined, undefined, 0)}
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
      data={[
        ..._.sortBy(res.data || [], (a) =>
          a.contact ? getContactName(a.contact) : "zzz"
        ),
        total as any,
      ]}
      showPagination={false}
    />
  );
};
