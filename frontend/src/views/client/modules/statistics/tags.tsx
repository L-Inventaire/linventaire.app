import { Tag } from "@atoms/badge/tag";
import { Button } from "@atoms/button/button";
import { InputLabel } from "@atoms/input/input-decoration-label";
import Select from "@atoms/input/input-select";
import Link from "@atoms/link";
import { ModalContent } from "@atoms/modal/modal";
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
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import * as XLSX from "xlsx";
import { fr } from "date-fns/locale";

// Sum amounts in cents to avoid floating point drift (0.1 + 0.2 != 0.3)
const sumAmounts = (values: (number | undefined)[]) =>
  values.reduce<number>((acc, v) => acc + Math.round((v || 0) * 100), 0) / 100;

const rowTotal = (row: DashboardTags) =>
  sumAmounts(Object.values(_.omit(row, "month")));

// Columns computed by the backend in addition to the real tags
const EXTRA_COLUMNS = [
  { id: "untagged", name: "Sans catégorie", color: "" },
  { id: "multiple", name: "Multiple catégories", color: "" },
  // Lines without article: down payments, down payment deductions, corrections
  { id: "adjustments", name: "Acomptes / corrections", color: "" },
] as Tags[];

export const TagsExportModal = ({
  year,
  onClose,
}: {
  year: number;
  onClose: () => void;
}) => {
  const [exportType, setExportType] = useState("xlsx");
  const [loading, setLoading] = useState(false);

  const res = useDashboardTags(year);
  const { tags } = useTags();

  const exportData = async () => {
    if (!res.data || !tags.data) return;

    setLoading(true);

    const usedTags = _.uniq(
      Object.values(res.data).reduce(
        (acc, monthly) => [...acc, ...Object.keys(monthly)],
        [] as string[],
      ),
    );
    const tagsSorted = _.sortBy(tags.data?.list, "name").filter((tag) =>
      usedTags.includes(tag.id),
    );
    tagsSorted.push(...EXTRA_COLUMNS);

    const data = res.data.map((monthly, index) => {
      const row: Record<string, string | number> = {
        Mois: format(new Date(year, index, 1), "MMMM yyyy", { locale: fr }),
      };
      tagsSorted.forEach((tag) => {
        row[tag.name] = sumAmounts([monthly[tag.id]]);
      });
      row["Total"] = rowTotal(monthly);
      return row;
    });

    // Add total row
    const totalRow: Record<string, string | number> = { Mois: "Total" };
    tagsSorted.forEach((tag) => {
      totalRow[tag.name] = sumAmounts(res.data.map((m) => m[tag.id]));
    });
    totalRow["Total"] = sumAmounts(res.data.map(rowTotal));
    data.push(totalRow);

    const fileName = `ca-${year}`;

    if (exportType === "xlsx") {
      const worksheet = XLSX.utils.json_to_sheet(data);
      // Display amounts with 2 decimals (values stay numeric)
      Object.values(worksheet).forEach((cell) => {
        if (cell && typeof cell === "object" && cell.t === "n") {
          cell.z = "#,##0.00";
        }
      });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, fileName);
      XLSX.writeFile(workbook, `${fileName}.xlsx`, { compression: true });
    } else if (exportType === "csv") {
      // French Excel format: ";" separator and "," decimal separator
      const escape = (e: string | number) => {
        const str =
          typeof e === "number" ? e.toFixed(2).replace(".", ",") : String(e);
        return /[;"\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
      };
      const header = Object.keys(data[0]).map(escape).join(";");
      const csv = data.map((row) => Object.values(row).map(escape).join(";"));
      const csvString = "﻿" + header + "\n" + csv.join("\n"); // BOM for UTF-8
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", fileName + ".csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    setLoading(false);
    onClose();
  };

  return (
    <ModalContent title="Export - Chiffre d'affaires catégorisé">
      <InputLabel
        className="mb-4"
        label="Format d'export"
        input={
          <Select
            onChange={(e) => setExportType(e.target.value)}
            disabled={loading}
          >
            <option value="xlsx">Excel</option>
            <option value="csv">CSV</option>
          </Select>
        }
      />
      <Button
        theme="primary"
        className="w-full mt-2"
        disabled={loading || !res.data}
        loading={loading}
        onClick={exportData}
      >
        Exporter
      </Button>
    </ModalContent>
  );
};

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
      [] as string[],
    ),
  );
  const tagsSorted = _.sortBy(tags.data?.list, "name").filter((tag) =>
    usedTags.includes(tag.id),
  );

  const getLink = (tag?: Tags, month?: number) => {
    // Invoices search can't filter on lines without article
    if (tag?.id === "adjustments") return undefined;
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
            JSON.stringify({ [`articles.computed_tags:${tag.name}`]: tag.id }),
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

  tagsSorted.push(...EXTRA_COLUMNS);

  const total = tagsSorted.reduce(
    (acc, tag) => ({
      ...acc,
      [tag.id]: sumAmounts(res.data.map((monthly) => monthly[tag.id])),
    }),
    { month: -1 } as DashboardTags,
  );

  return (
    <Table
      border
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
              className={twMerge(
                getLink(a) && "hover:underline cursor-pointer",
              )}
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
                getLink(a) && "hover:underline cursor-pointer",
                (row[a.id] || 0) > 0
                  ? ""
                  : (row[a.id] || 0) < 0
                    ? "text-red-500"
                    : "opacity-50",
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
            const total = rowTotal(row);
            return (
              <Link
                noColor
                className={twMerge(
                  "hover:underline cursor-pointer",
                  (total || 0) > 0
                    ? ""
                    : (total || 0) < 0
                      ? "text-red-500"
                      : "opacity-50",
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
