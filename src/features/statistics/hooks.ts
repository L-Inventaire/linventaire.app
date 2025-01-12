import { Invoices } from "@features/invoices/types/types";
import {
  isErrorResponse,
  StandardResponse,
} from "@features/utils/rest/types/types";
import { useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { StatisticsApiClient } from "./api-client/api-client";
import { Statistics } from "./types";

const blankStatistics: Statistics = {
  totalRevenue: 0,
  totalRevenueTable: [],
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
  almostLatePaymentsNoDelay: [],
  almostLatePayments30Delay: [],
  almostLatePayments60Delay: [],
  almostLatePayments90Delay: [],
  almostLatePayments120Delay: [],
  totalStockEntries: 0,
  totalStockExits: 0,
  totalSignedQuotes: 0,
  totalSentQuotes: 0,
  totalPaidInvoices: 0,
  totalSentInvoices: 0,
  totalSentPurchaseOrders: 0,
  clientBalanceTable: [],
};

export const useStatistics = (
  clientID: string | undefined | null,
  period: string = "year",
  startDate?: Date,
  endDate?: Date
): Statistics & {
  formattedData: any;
  almostLateDeliveriesEntities: Invoices[];
  almostLatePaymentsEntities: Invoices[];
  almostLatePaymentsNoDelayEntities: Invoices[];
  almostLatePayments30DelayEntities: Invoices[];
  almostLatePayments60DelayEntities: Invoices[];
  almostLatePayments90DelayEntities: Invoices[];
  almostLatePayments120DelayEntities: Invoices[];
} => {
  const statistics = useQuery({
    queryKey: [
      "statistics",
      clientID,
      period ?? "year",
      "startDate",
      startDate,
      "endDate",
      endDate,
    ],
    queryFn: () =>
      StatisticsApiClient.getStatistics(
        clientID!,
        period ?? "year",
        startDate,
        endDate
      ),
    enabled: !!clientID,
  });

  // TODO je désactive tout pour le moment car c'est pas typé en back, ni en front, ça fait planter le front car ça fait des appels random
  const almostLateDeliveries: Invoices[] = [];
  const almostLatePayments: Invoices[] = [];
  const almostLatePaymentsNoDelay: Invoices[] = [];
  const almostLatePayments30Delay: Invoices[] = [];
  const almostLatePayments60Delay: Invoices[] = [];
  const almostLatePayments90Delay: Invoices[] = [];
  const almostLatePayments120Delay: Invoices[] = [];

  /*

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
          limit: 0,
        }
      : {
          query: generateQueryFromMap({
            id: (statistics?.data as Statistics)?.almostLateDeliveries || [],
          }),
          limit: 10,
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

  const { invoices: almostLatePaymentsNoDelay } = useInvoices(
    ((statistics?.data as Statistics)?.almostLatePaymentsNoDelay || [])
      .length === 0
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
            id:
              (statistics?.data as Statistics)?.almostLatePaymentsNoDelay || [],
          }),
        }
  );

  const { invoices: almostLatePayments30Delay } = useInvoices(
    ((statistics?.data as Statistics)?.almostLatePayments30Delay || [])
      .length === 0
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
            id:
              (statistics?.data as Statistics)?.almostLatePayments30Delay || [],
          }),
        }
  );

  const { invoices: almostLatePayments60Delay } = useInvoices(
    ((statistics?.data as Statistics)?.almostLatePayments60Delay || [])
      .length === 0
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
            id:
              (statistics?.data as Statistics)?.almostLatePayments60Delay || [],
          }),
        }
  );

  const { invoices: almostLatePayments90Delay } = useInvoices(
    ((statistics?.data as Statistics)?.almostLatePayments90Delay || [])
      .length === 0
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
            id:
              (statistics?.data as Statistics)?.almostLatePayments90Delay || [],
          }),
        }
  );

  const { invoices: almostLatePayments120Delay } = useInvoices(
    ((statistics?.data as Statistics)?.almostLatePayments120Delay || [])
      .length === 0
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
            id:
              (statistics?.data as Statistics)?.almostLatePayments120Delay ||
              [],
          }),
        }
  );
  */

  if (!statistics?.data) {
    return {
      ...blankStatistics,
      formattedData: [],
      almostLateDeliveriesEntities: [],
      almostLatePaymentsEntities: [],
      almostLatePaymentsNoDelayEntities: [],
      almostLatePayments30DelayEntities: [],
      almostLatePayments60DelayEntities: [],
      almostLatePayments90DelayEntities: [],
      almostLatePayments120DelayEntities: [],
    };
  }

  if (isErrorResponse(statistics.data ?? {})) {
    return {
      ...blankStatistics,
      formattedData: [],
      almostLateDeliveriesEntities: [],
      almostLatePaymentsEntities: [],
      almostLatePaymentsNoDelayEntities: [],
      almostLatePayments30DelayEntities: [],
      almostLatePayments60DelayEntities: [],
      almostLatePayments90DelayEntities: [],
      almostLatePayments120DelayEntities: [],
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
    almostLateDeliveriesEntities: almostLateDeliveries ?? [],
    almostLatePaymentsEntities: almostLatePayments ?? [],
    almostLatePaymentsNoDelayEntities: almostLatePaymentsNoDelay ?? [],
    almostLatePayments30DelayEntities: almostLatePayments30Delay ?? [],
    almostLatePayments60DelayEntities: almostLatePayments60Delay ?? [],
    almostLatePayments90DelayEntities: almostLatePayments90Delay ?? [],
    almostLatePayments120DelayEntities: almostLatePayments120Delay ?? [],
  };
};
