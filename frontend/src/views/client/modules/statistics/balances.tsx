import { DropdownButton } from "@/atoms/dropdown";
import { useNavigateAlt } from "@/features/utils/navigate";
import Link from "@atoms/link";
import { getContactName } from "@features/contacts/types/types";
import { getRoute, ROUTES } from "@features/routes";
import { useDashboardBalances } from "@features/statistics/hooks";
import { DashboardBalances, LateCellType } from "@features/statistics/types";
import { formatAmount } from "@features/utils/format/strings";
import {
  DocumentCheckIcon,
  ReceiptRefundIcon,
} from "@heroicons/react/16/solid";
import { Table } from "@molecules/table";
import { Spinner } from "@radix-ui/themes";
import _ from "lodash";
import { twMerge } from "tailwind-merge";

const getLink = (
  type: "client" | "supplier",
  contactObj: any,
  contact?: string,
  from?: number,
  to?: number,
  document: "invoices" | "credit_notes" = "invoices"
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
          fromDate && toDate
            ? `${fromDate}->${toDate}`
            : fromDate
            ? `>=${fromDate || new Date().toISOString().split("T")[0]}`
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
          ? document === "invoices"
            ? "invoices"
            : "credit_notes"
          : "supplier_invoices+supplier_credit_notes",
    }) +
    "?" +
    query
  );
};

export const BalancesPage = ({ type }: { type: "client" | "supplier" }) => {
  const res = useDashboardBalances(type);
  if (!res.data) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner />
      </div>
    );
  }

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
              href={getLink(type, row.contact, row.id)}
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
              href={getLink(type, undefined, undefined, 0, undefined)}
            >
              Non échus
            </Link>
          ),
          cellClassName: "justify-end",
          headClassName: "justify-end",
          render: (row: DashboardBalances[0]) => (
            <ClickableValue
              value={row.future}
              row={row}
              type={type}
              from={0}
              to={undefined}
            />
          ),
        },
        {
          title: (
            <Link
              noColor
              className={twMerge("hover:underline cursor-pointer")}
              href={getLink(type, undefined, undefined, 30, 0)}
            >
              1-30
            </Link>
          ),
          cellClassName: "justify-end",
          headClassName: "justify-end",
          render: (row: DashboardBalances[0]) => (
            <ClickableValue
              value={row.d30}
              row={row}
              type={type}
              from={30}
              to={0}
            />
          ),
        },
        {
          title: (
            <Link
              noColor
              className={twMerge("hover:underline cursor-pointer")}
              href={getLink(type, undefined, undefined, 60, 31)}
            >
              31-60
            </Link>
          ),
          cellClassName: "justify-end",
          headClassName: "justify-end",
          render: (row: DashboardBalances[0]) => (
            <ClickableValue
              value={row.d60}
              row={row}
              type={type}
              from={60}
              to={31}
            />
          ),
        },
        {
          title: (
            <Link
              noColor
              className={twMerge("hover:underline cursor-pointer")}
              href={getLink(type, undefined, undefined, 90, 61)}
            >
              61-90
            </Link>
          ),
          cellClassName: "justify-end",
          headClassName: "justify-end",
          render: (row: DashboardBalances[0]) => (
            <ClickableValue
              value={row.d90}
              row={row}
              type={type}
              from={90}
              to={61}
            />
          ),
        },
        {
          title: (
            <Link
              noColor
              className={twMerge("hover:underline cursor-pointer")}
              href={getLink(type, undefined, undefined, 120, 91)}
            >
              91-120
            </Link>
          ),
          cellClassName: "justify-end",
          headClassName: "justify-end",
          render: (row: DashboardBalances[0]) => (
            <ClickableValue
              value={row.d120}
              row={row}
              type={type}
              from={120}
              to={91}
            />
          ),
        },
        {
          title: (
            <Link
              noColor
              className={twMerge("hover:underline cursor-pointer")}
              href={getLink(type, undefined, undefined, undefined, 120)}
            >
              120+
            </Link>
          ),
          cellClassName: "justify-end",
          headClassName: "justify-end",
          render: (row: DashboardBalances[0]) => (
            <ClickableValue
              value={row.d120plus}
              row={row}
              type={type}
              from={undefined}
              to={120}
            />
          ),
        },
        {
          title: (
            <Link
              noColor
              className={twMerge("hover:underline cursor-pointer")}
              href={getLink(type, undefined, undefined)}
            >
              Total
            </Link>
          ),
          cellClassName: "justify-end",
          headClassName: "justify-end",
          render: (row: DashboardBalances[0]) => (
            <ClickableValue
              value={row.total}
              row={row}
              type={type}
              from={undefined}
              to={undefined}
            />
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

export const ClickableValue = ({
  row,
  value,
  type,
  from,
  to,
}: {
  row: DashboardBalances[0];
  value: LateCellType;
  type: "client" | "supplier";
  from?: number;
  to?: number;
}) => {
  const navigateAlt = useNavigateAlt();

  if (value.count_credit_notes === 0 || value.count_invoices === 0) {
    return (
      <Link
        noColor
        className={twMerge("hover:underline cursor-pointer")}
        href={getLink(
          type,
          row.contact,
          row.id,
          from,
          to,
          value.count_invoices === 0 ? "credit_notes" : "invoices"
        )}
      >
        {formatAmount(value.total)}
      </Link>
    );
  } else {
    // Should show both link to invoices and credit notes
    return (
      <DropdownButton
        position="bottom"
        theme="invisible"
        menu={[
          {
            label: "Factures pour " + formatAmount(value.total_invoices),
            icon: (p) => <DocumentCheckIcon {...p} />,
            onClick: (event) =>
              navigateAlt(
                getLink(type, row.contact, row.id, from, to, "invoices"),
                { event }
              ),
          },
          {
            label: "Avoirs pour " + formatAmount(value.total_credit_notes),
            icon: (p) => <ReceiptRefundIcon {...p} />,
            onClick: (event) =>
              navigateAlt(
                getLink(type, row.contact, row.id, from, to, "credit_notes"),
                { event }
              ),
          },
        ]}
      >
        <Link
          noColor
          className={twMerge("hover:underline cursor-pointer")}
          href="#"
        >
          {formatAmount(value.total)}
        </Link>
      </DropdownButton>
    );
  }
};
