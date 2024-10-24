import { useQuery } from "@tanstack/react-query";
import { StatisticsApiClient } from "./api-client/api-client";
import {
  isErrorResponse,
  StandardResponse,
} from "@features/utils/rest/types/types";
import { DateTime } from "luxon";
import { useInvoices } from "@features/invoices/hooks/use-invoices";
import { generateQueryFromMap } from "@components/search-bar/utils/utils";
import { Invoices } from "@features/invoices/types/types";
import { Statistics } from "./types";

const blankStatistics: Statistics = {
  totalRevenue: 0,
  revenue: 0,
  revenueStats: [],
  totalExpenses: 0,
  expenses: 0,
  benefits: 0,
  totalBenefits: 0,
  stockEntries: 0,
  stockExits: 0,
  signedQuotes: 0,
  sentQuotes: 0,
  paidInvoices: 0,
  sentInvoices: 0,
  sentPurchaseOrders: 0,
  almostLateDeliveries: [],
  almostLatePayments: [],
  totalStockEntries: 0,
  totalStockExits: 0,
  totalSignedQuotes: 0,
  totalSentQuotes: 0,
  totalPaidInvoices: 0,
  totalSentInvoices: 0,
  totalSentPurchaseOrders: 0,
};

export const useStatistics = (
  clientID: string | undefined | null,
  period: string = "year"
): Statistics & {
  formattedData: any;
  almostLateDeliveriesEntities: Invoices[];
  almostLatePaymentsEntities: Invoices[];
} => {
  const statistics = useQuery({
    queryKey: ["statistics", clientID, period ?? "year"],
    queryFn: () =>
      StatisticsApiClient.getStatistics(clientID!, period ?? "year"),
    enabled: !!clientID,
  });

  const noStatistics =
    isErrorResponse(statistics.data ?? {}) || !statistics?.data;

  const noAlmostLateDeliveries =
    noStatistics ||
    (!isErrorResponse(statistics.data ?? {}) &&
      ((statistics?.data as Statistics)?.almostLateDeliveries ?? [])?.length ===
        0);

  const noAlmostLatePayments =
    noStatistics ||
    (!isErrorResponse(statistics.data ?? {}) &&
      ((statistics?.data as Statistics)?.almostLatePayments ?? [])?.length ===
        0);

  const { invoices: almostLateDeliveries } = useInvoices(
    noAlmostLateDeliveries
      ? {
          query: [
            {
              key: "id",
              values: [{ op: "equals", value: "#" }],
            },
          ],
        }
      : {
          query: generateQueryFromMap({
            id: (statistics?.data as Statistics)?.almostLateDeliveries || [],
          }),
        }
  );

  const { invoices: almostLatePayments } = useInvoices(
    noAlmostLatePayments
      ? {
          query: [
            {
              key: "id",
              values: [{ op: "equals", value: "#" }],
            },
          ],
        }
      : {
          query: generateQueryFromMap({
            id: (statistics?.data as Statistics)?.almostLatePayments || [],
          }),
        }
  );

  if (!statistics?.data) {
    return {
      ...blankStatistics,
      formattedData: [],
      almostLateDeliveriesEntities: [],
      almostLatePaymentsEntities: [],
    };
  }

  if (isErrorResponse(statistics.data ?? {})) {
    return {
      ...blankStatistics,
      formattedData: [],
      almostLateDeliveriesEntities: [],
      almostLatePaymentsEntities: [],
    };
  }

  const statisticsData = statistics.data as StandardResponse<Statistics>;

  const locale = navigator.language;
  const stats = statisticsData.revenueStats;

  let formattedData: {
    x: string;
    y: string;
  }[] = [];

  if (period === "year" && stats.length > 0) {
    formattedData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(
      (monthNumber) => {
        const foundStat = stats.find(
          (item) =>
            DateTime.fromISO(item.date).setZone("utc").month === monthNumber
        );
        const monthDate = DateTime.local()
          .set({ month: monthNumber })
          .setLocale(locale);

        return {
          x: monthDate.monthShort,
          y: (foundStat?.net_amount || 0) + " €",
        };
      }
    );
  }

  if (period === "month" && stats.length > 0) {
    const firstDate = DateTime.fromISO(stats[0]?.date).setZone("utc");

    let cursor = DateTime.fromISO(stats[0]?.date)
      .setZone("utc")
      // Some weeks start on previous month
      .plus({ days: 3 })
      .startOf("month")
      .startOf("week");

    const allowedMonths = [
      cursor.month,
      firstDate.month,
      firstDate.plus({ days: 3 }).month,
    ];

    let weekDates: string[] = [cursor.toISODate() ?? ""];

    while (allowedMonths.includes(cursor.month)) {
      cursor = cursor.plus({ weeks: 1 });
      if (!allowedMonths.includes(cursor.month)) break;
      weekDates.push(cursor.toISODate() ?? "");
    }

    formattedData = weekDates.map((weekDate) => {
      const date = DateTime.fromISO(weekDate ?? "now");
      const foundStat = stats.find(
        (item) => DateTime.fromISO(item.date).weekNumber === date.weekNumber
      );
      const localeDate = DateTime.local()
        .set({ weekNumber: date.weekNumber })
        .setLocale(locale);

      return {
        x: "W" + localeDate.weekNumber.toString(),
        y: (foundStat?.net_amount || 0) + " €",
      };
    });
  }

  if (period === "week" && stats.length > 0) {
    formattedData = [1, 2, 3, 4, 5, 6, 7].map((dayNumber) => {
      const foundStat = stats.find(
        (item) =>
          DateTime.fromISO(item.date).setZone("utc").weekday === dayNumber
      );

      const firstDay = DateTime.fromISO(stats[0]?.date)
        .setZone("utc")
        .startOf("week");
      const dayDate = firstDay.plus({ days: dayNumber - 1 }).setLocale(locale);

      return {
        x: dayDate.weekdayShort ?? "err.",
        y: (foundStat?.net_amount || 0) + " €",
      };
    });
  }

  return {
    ...statisticsData,
    formattedData,
    almostLateDeliveriesEntities: almostLateDeliveries?.data?.list ?? [],
    almostLatePaymentsEntities: almostLatePayments?.data?.list ?? [],
  };
};
