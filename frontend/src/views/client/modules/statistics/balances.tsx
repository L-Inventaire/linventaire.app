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

  const getLink = (
    contactObj: any,
    contact?: string,
    from?: number,
    to?: number
  ) => {
    const contactName = contactObj ? getContactName(contactObj) : null;
    const fromDate =
      from !== undefined
        ? new Date(Date.now() - from * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]
        : "";
    const toDate =
      to !== undefined
        ? new Date(Date.now() - to * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]
        : "";
    const contactKey = `${
      type === "client" ? "client" : "supplier"
    }:"${contactName}"`;

    const q = [
      `!state:"closed"`,
      contact !== undefined ? contactKey : "",
      from !== undefined || to !== undefined
        ? `payment_information.computed_date:${
            fromDate
              ? `${fromDate}->${
                  toDate || new Date().toISOString().split("T")[0]
                }`
              : `<=${toDate || new Date().toISOString().split("T")[0]}`
          }`
        : "",
    ]
      .filter(Boolean)
      .join(" ");
    const query = [
      `q=${encodeURIComponent(q)}`,
      contact !== undefined
        ? `map=${encodeURIComponent(
            JSON.stringify({
              [contactKey]: contact,
            })
          )}`
        : false,
    ]
      .filter(Boolean)
      .join("&");
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
    future: {
      total: res.data.reduce((acc, item) => acc + item.future.total, 0),
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
      border
      columns={[
        {
          title: "Client",
          thClassName: "w-1/4",
          render: (row: DashboardBalances[0]) => (
            <Link
              noColor
              className={twMerge("hover:underline cursor-pointer")}
              href={getLink(row.contact, row.id)}
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
              href={getLink(undefined, undefined, 0, undefined)}
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
              href={getLink(row.contact, row.id, 0, undefined)}
            >
              {formatAmount(row.total.total - row.future.total)}
            </Link>
          ),
        },
        {
          title: (
            <Link
              noColor
              className={twMerge("hover:underline cursor-pointer")}
              href={getLink(undefined, undefined, 30, 0)}
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
              href={getLink(row.contact, row.id, 30, 0)}
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
              href={getLink(undefined, undefined, 60, 31)}
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
              href={getLink(row.contact, undefined, 60, 31)}
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
              href={getLink(undefined, undefined, 90, 61)}
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
              href={getLink(row.contact, row.id, 90, 61)}
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
              href={getLink(undefined, undefined, 120, 91)}
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
              href={getLink(row.contact, row.id, 120, 91)}
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
              href={getLink(undefined, undefined, undefined, 120)}
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
              href={getLink(row.contact, row.id, undefined, 120)}
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
              href={getLink(undefined, undefined)}
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
              href={getLink(row.contact, row.id)}
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
