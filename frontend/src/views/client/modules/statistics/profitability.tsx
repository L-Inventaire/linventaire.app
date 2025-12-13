import { Button } from "@atoms/button/button";
import { InputLabel } from "@atoms/input/input-decoration-label";
import Select from "@atoms/input/input-select";
import Link from "@atoms/link";
import { ModalContent } from "@atoms/modal/modal";
import { Info } from "@atoms/text";
import { getRoute, ROUTES } from "@features/routes";
import { StatisticsApiClient } from "@features/statistics/api-client/api-client";
import {
  ClientProfitabilityLine,
  ClientProfitabilityResult,
  TimeRange,
} from "@features/statistics/types";
import { useCurrentClient } from "@features/clients/state/use-clients";
import { formatAmount } from "@features/utils/format/strings";
import { Table } from "@molecules/table";
import { Spinner } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import * as XLSX from "xlsx";

// Hook for client profitability
export const useClientProfitability = (
  timeRanges: TimeRange[],
  clientIds?: string[]
) => {
  const { client } = useCurrentClient();

  const profitability = useQuery<ClientProfitabilityResult[]>({
    queryKey: [
      "client-profitability",
      client?.id,
      JSON.stringify(timeRanges),
      JSON.stringify(clientIds),
    ],
    queryFn: () =>
      StatisticsApiClient.getClientProfitability(client!.id, {
        timeRanges,
        clientIds,
      }),
    enabled: !!client?.id && timeRanges.length > 0,
  });

  return profitability;
};

// Export modal
export const ProfitabilityExportModal = ({
  years,
  clientIds,
  onClose,
}: {
  years: number[];
  clientIds?: string[];
  onClose: () => void;
}) => {
  const [exportType, setExportType] = useState("xlsx");
  const [loading, setLoading] = useState(false);

  const timeRanges: TimeRange[] = years.map((year) => ({
    label: year.toString(),
    from: `${year}-01-01`,
    to: `${year}-12-31`,
  }));

  const res = useClientProfitability(timeRanges, clientIds);

  const exportData = async () => {
    if (!res.data) return;

    setLoading(true);

    const allData: Record<string, any>[] = [];

    for (const periodResult of res.data) {
      // Add header row for period
      if (res.data.length > 1) {
        allData.push({
          Client: `=== ${periodResult.period.label} ===`,
          "Chiffre d'affaires": "",
          "Coût estimé min": "",
          "Coût estimé max": "",
          "Bénéfice min": "",
          "Bénéfice max": "",
          Factures: "",
          Commandes: "",
        });
      }

      // Add data rows
      for (const item of periodResult.data) {
        allData.push({
          Client: item.client_name,
          "Chiffre d'affaires": item.revenue,
          "Coût estimé min": item.min_cost,
          "Coût estimé max": item.max_cost,
          "Bénéfice min": item.min_profit,
          "Bénéfice max": item.max_profit,
          Factures: item.invoice_count,
          Commandes: item.quote_count,
        });
      }

      // Add totals row
      const totals = periodResult.data.reduce(
        (acc, item) => ({
          revenue: acc.revenue + item.revenue,
          min_cost: acc.min_cost + item.min_cost,
          max_cost: acc.max_cost + item.max_cost,
          min_profit: acc.min_profit + item.min_profit,
          max_profit: acc.max_profit + item.max_profit,
          invoice_count: acc.invoice_count + item.invoice_count,
          quote_count: acc.quote_count + item.quote_count,
        }),
        {
          revenue: 0,
          min_cost: 0,
          max_cost: 0,
          min_profit: 0,
          max_profit: 0,
          invoice_count: 0,
          quote_count: 0,
        }
      );

      allData.push({
        Client: "Total",
        "Chiffre d'affaires": totals.revenue,
        "Coût estimé min": totals.min_cost,
        "Coût estimé max": totals.max_cost,
        "Bénéfice min": totals.min_profit,
        "Bénéfice max": totals.max_profit,
        Factures: totals.invoice_count,
        Commandes: totals.quote_count,
      });

      // Add empty row between periods
      if (res.data.length > 1) {
        allData.push({
          Client: "",
          "Chiffre d'affaires": "",
          "Coût estimé min": "",
          "Coût estimé max": "",
          "Bénéfice min": "",
          "Bénéfice max": "",
          Factures: "",
          Commandes: "",
        });
      }
    }

    const fileName = `export-benefices-clients-${years.join("-")}`;

    if (exportType === "xlsx") {
      const worksheet = XLSX.utils.json_to_sheet(allData);

      // Set column widths
      worksheet["!cols"] = [
        { wch: 30 }, // Client
        { wch: 18 }, // Chiffre d'affaires
        { wch: 15 }, // Coût estimé min
        { wch: 15 }, // Coût estimé max
        { wch: 15 }, // Bénéfice min
        { wch: 15 }, // Bénéfice max
        { wch: 10 }, // Factures
        { wch: 10 }, // Commandes
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Bénéfices par clients"
      );
      XLSX.writeFile(workbook, `${fileName}.xlsx`, { compression: true });
    } else if (exportType === "csv") {
      const header = Object.keys(allData[0]).join(";");
      const csv = allData.map((row) =>
        Object.values(row)
          .map((e) => {
            if (
              typeof e === "string" &&
              (e.includes(";") || e.includes('"') || e.includes("\n"))
            ) {
              return `"${e.replace(/"/g, '""')}"`;
            }
            return e;
          })
          .join(";")
      );
      const csvString = "\uFEFF" + header + "\n" + csv.join("\n"); // BOM for UTF-8
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
    <ModalContent title="Export - Bénéfices par clients">
      <Info className="mb-4">
        Export des données de rentabilité par client pour{" "}
        {years.length > 1
          ? "les années " + years.join(", ")
          : "l'année " + years[0]}
        {clientIds &&
          clientIds.length > 0 &&
          ` (${clientIds.length} client(s) sélectionné(s))`}
        .
      </Info>
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

// Main page component
export const ProfitabilityPage = ({
  years,
  clientIds,
}: {
  years: number[];
  clientIds?: string[];
}) => {
  const timeRanges: TimeRange[] = years.map((year) => ({
    label: year.toString(),
    from: `${year}-01-01`,
    to: `${year}-12-31`,
  }));

  const res = useClientProfitability(
    timeRanges,
    clientIds && clientIds.length > 0 ? clientIds : undefined
  );

  if (res.isLoading || !res.data) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner />
      </div>
    );
  }

  if (res.data.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <Info>Aucune donnée disponible pour la période sélectionnée.</Info>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {res.data.map((periodResult, periodIndex) => (
        <div key={periodIndex}>
          {res.data.length > 1 && (
            <div className="mb-4">
              <Info className="font-semibold text-lg">
                {periodResult.period.label}
              </Info>
            </div>
          )}

          <Table<ClientProfitabilityLine>
            border
            showPagination={false}
            data={periodResult.data}
            columns={[
              {
                title: "Client",
                render: (row: ClientProfitabilityLine) => (
                  <Link
                    noColor
                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400"
                    href={getRoute(ROUTES.ContactsView, { id: row.client_id })}
                  >
                    {row.client_name}
                  </Link>
                ),
              },
              {
                title: "Chiffre d'affaires",
                headClassName: "justify-end",
                cellClassName: "justify-end",
                render: (row: ClientProfitabilityLine) => (
                  <span
                    className={twMerge(
                      "font-medium",
                      row.revenue >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    )}
                  >
                    {formatAmount(row.revenue)}
                  </span>
                ),
              },
              {
                title: "Coût estimé min",
                headClassName: "justify-end",
                cellClassName: "justify-end",
                render: (row: ClientProfitabilityLine) => (
                  <span className="text-orange-600 dark:text-orange-400">
                    {formatAmount(row.min_cost)}
                  </span>
                ),
              },
              {
                title: "Coût estimé max",
                headClassName: "justify-end",
                cellClassName: "justify-end",
                render: (row: ClientProfitabilityLine) => (
                  <span className="text-orange-600 dark:text-orange-400">
                    {formatAmount(row.max_cost)}
                  </span>
                ),
              },
              {
                title: "Bénéfice min",
                headClassName: "justify-end",
                cellClassName: "justify-end",
                render: (row: ClientProfitabilityLine) => (
                  <span
                    className={twMerge(
                      "font-medium",
                      row.min_profit >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    )}
                  >
                    {formatAmount(row.min_profit)}
                  </span>
                ),
              },
              {
                title: "Bénéfice max",
                headClassName: "justify-end",
                cellClassName: "justify-end",
                render: (row: ClientProfitabilityLine) => (
                  <span
                    className={twMerge(
                      "font-medium",
                      row.max_profit >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    )}
                  >
                    {formatAmount(row.max_profit)}
                  </span>
                ),
              },
              {
                title: "Factures",
                headClassName: "justify-end",
                cellClassName: "justify-end",
                render: (row: ClientProfitabilityLine) => (
                  <span className="text-slate-600 dark:text-slate-400">
                    {row.invoice_count}
                  </span>
                ),
              },
              {
                title: "Commandes",
                headClassName: "justify-end",
                cellClassName: "justify-end",
                render: (row: ClientProfitabilityLine) => (
                  <span className="text-slate-600 dark:text-slate-400">
                    {row.quote_count}
                  </span>
                ),
              },
            ]}
          />

          {/* Totals row */}
          <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-4 md:grid-cols-8 gap-4 text-sm">
              <div>
                <div className="text-slate-500 dark:text-slate-400">
                  Total clients
                </div>
                <div className="font-semibold">{periodResult.data.length}</div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">
                  Chiffre d'affaires
                </div>
                <div className="font-semibold text-green-600 dark:text-green-400">
                  {formatAmount(
                    periodResult.data.reduce((acc, row) => acc + row.revenue, 0)
                  )}
                </div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">
                  Coût min
                </div>
                <div className="font-semibold text-orange-600 dark:text-orange-400">
                  {formatAmount(
                    periodResult.data.reduce(
                      (acc, row) => acc + row.min_cost,
                      0
                    )
                  )}
                </div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">
                  Coût max
                </div>
                <div className="font-semibold text-orange-600 dark:text-orange-400">
                  {formatAmount(
                    periodResult.data.reduce(
                      (acc, row) => acc + row.max_cost,
                      0
                    )
                  )}
                </div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">
                  Bénéfice min
                </div>
                <div className="font-semibold text-green-600 dark:text-green-400">
                  {formatAmount(
                    periodResult.data.reduce(
                      (acc, row) => acc + row.min_profit,
                      0
                    )
                  )}
                </div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">
                  Bénéfice max
                </div>
                <div className="font-semibold text-green-600 dark:text-green-400">
                  {formatAmount(
                    periodResult.data.reduce(
                      (acc, row) => acc + row.max_profit,
                      0
                    )
                  )}
                </div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">
                  Factures
                </div>
                <div className="font-semibold">
                  {periodResult.data.reduce(
                    (acc, row) => acc + row.invoice_count,
                    0
                  )}
                </div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">
                  Commandes
                </div>
                <div className="font-semibold">
                  {periodResult.data.reduce(
                    (acc, row) => acc + row.quote_count,
                    0
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
