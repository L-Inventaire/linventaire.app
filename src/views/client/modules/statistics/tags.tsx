import { Tag } from "@atoms/badge/tag";
import Link from "@atoms/link";
import { getRoute, ROUTES } from "@features/routes";
import { useDashboardTags } from "@features/statistics/hooks";
import { DashboardTags } from "@features/statistics/types";
import { useTags } from "@features/tags/hooks/use-tags";
import { Tags } from "@features/tags/types/types";
import { formatAmount } from "@features/utils/format/strings";
import { Table } from "@molecules/table";
import { Spinner } from "@radix-ui/themes";
import { format } from "date-fns";
import _ from "lodash";
import { useEffect } from "react";
import { twMerge } from "tailwind-merge";

export const TagsPage = ({ year }: { year: number }) => {
  const res = useDashboardTags(year);
  const { tags, refresh } = useTags();
  useEffect(() => {
    refresh();
  }, []);

  if (!res.data || !tags.data) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner />
      </div>
    );
  }

  const usedTags = _.uniq(
    Object.values(res.data).reduce(
      (acc, monthly) => [...acc, ...Object.keys(monthly)],
      [] as string[]
    )
  );
  const tagsSorted = _.sortBy(tags.data?.list, "name").filter((tag) =>
    usedTags.includes(tag.id)
  );

  const getLink = (tag?: Tags, month?: number) => {
    const q = [
      month ? `emit_date:${format(new Date(year, month, 1), "yyyy-MM")}` : "",
      tag ? `articles.computed_tags:"${tag.name}"` : "",
    ]
      .filter(Boolean)
      .join(" ");
    const query = [
      `q=${encodeURIComponent(q)}`,
      tag
        ? `map=${encodeURIComponent(
            JSON.stringify({ [`articles.computed_tags:${tag.name}`]: tag.id })
          )}`
        : "",
    ]
      .filter(Boolean)
      .join("&");
    return getRoute(ROUTES.Invoices, { type: "invoices" }) + "?" + query;
  };

  if (tagsSorted.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <span className="text-gray-500">Aucune donnée disponible</span>
      </div>
    );
  }

  return (
    <Table
      columns={[
        {
          title: "Date",
          thClassName: "w-40",
          cellClassName: "border-r whitespace-nowrap",
          render: (row) => (
            <Link
              noColor
              className={twMerge("hover:underline cursor-pointer")}
              href={getLink(undefined, row.month)}
            >
              {format(new Date(year, row.month, 1), "MMMM yyyy")}
            </Link>
          ),
        },
        ...tagsSorted.map((a) => ({
          title: (
            <Link
              noColor
              className={twMerge("hover:underline cursor-pointer")}
              href={getLink(a)}
            >
              <Tag color={a.color} size="xs">
                {a.name}
              </Tag>
            </Link>
          ),
          thClassName: "opacity-100",
          headClassName: "justify-end",
          cellClassName: "justify-end",
          render: (row: DashboardTags) => (
            <Link
              noColor
              className={twMerge(
                "hover:underline cursor-pointer",
                (row[a.id] || 0) > 0
                  ? ""
                  : (row[a.id] || 0) < 0
                  ? "text-red-500"
                  : "opacity-50"
              )}
              href={getLink(a, row.month)}
            >
              <span>{formatAmount(row[a.id] || 0)}</span>
            </Link>
          ),
        })),
      ]}
      showPagination={false}
      data={res.data.map((a, i) => ({ ...a, month: i }))}
    />
  );
};
