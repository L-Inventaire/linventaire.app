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
      month !== undefined
        ? `emit_date:${format(new Date(year, month, 1), "yyyy-MM")}`
        : "",
      tag
        ? tag.id === "multiple"
          ? `articles.computed_tags:>=2`
          : `articles.computed_tags:"${tag.id === "untagged" ? "" : tag.name}"`
        : "",
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

  tagsSorted.push({
    id: "untagged",
    name: "Sans catégorie",
    color: "",
  } as Tags);
  tagsSorted.push({
    id: "multiple",
    name: "Multiple catégories",
    color: "",
  } as Tags);

  const total = tagsSorted.reduce(
    (acc, tag) => ({
      ...acc,
      [tag.id]: Object.values(res.data).reduce(
        (acc, monthly) => acc + (monthly[tag.id] || 0),
        0
      ),
    }),
    { month: -1 } as DashboardTags
  );

  return (
    <Table
      columns={[
        {
          title: "Date",
          thClassName: "w-40",
          cellClassName: "whitespace-nowrap",
          render: (row) =>
            row.month >= 0 ? (
              <Link
                noColor
                className={twMerge("hover:underline cursor-pointer")}
                href={getLink(undefined, row.month)}
              >
                {format(new Date(year, row.month, 1), "MMMM yyyy")}
              </Link>
            ) : (
              "Total"
            ),
        },
        ...tagsSorted.map((a) => ({
          title: (
            <Link
              noColor
              className={twMerge("hover:underline cursor-pointer")}
              href={getLink(a)}
            >
              {a.color ? (
                <Tag color={a.color} size="xs">
                  {a.name}
                </Tag>
              ) : (
                a.name
              )}
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
        {
          title: <strong>Total</strong>,
          thClassName: "w-40",
          headClassName: "justify-end",
          cellClassName: "justify-end",
          render: (row: DashboardTags) => {
            const total = Object.values(_.omit(row, "month")).reduce(
              (acc, a) => acc + (a || 0),
              0
            );
            return (
              <Link
                noColor
                className={twMerge(
                  "hover:underline cursor-pointer",
                  (total || 0) > 0
                    ? ""
                    : (total || 0) < 0
                    ? "text-red-500"
                    : "opacity-50"
                )}
                href={getLink(undefined, row.month)}
              >
                <strong>{formatAmount(total || 0)}</strong>
              </Link>
            );
          },
        },
      ]}
      showPagination={false}
      data={[...res.data.map((a, i) => ({ ...a, month: i })), total]}
    />
  );
};
