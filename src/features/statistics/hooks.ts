import { useQuery } from "@tanstack/react-query";
import { StatisticsApiClient } from "./api-client/api-client";
import { isErrorResponse } from "@features/utils/rest/types/types";
import { DateTime } from "luxon";
import { useInvoices } from "@features/invoices/hooks/use-invoices";
import { generateQueryFromMap } from "@components/search-bar/utils/utils";
import { Invoices } from "@features/invoices/types/types";

const blankStatistics: Statistics = {
  totalRevenue: 0,
  revenueStats: [],
  totalExpenses: null,
  benefits: null,
  stockEntries: null,
  stockExits: null,
  signedQuotes: null,
  sentQuotes: null,
  paidInvoices: null,
  sentInvoices: null,
  sentPurchaseOrders: null,
  almostLateDeliveries: null,
};

export const useStatistics = (
  clientID: string | undefined | null
): Statistics & {
  formattedData: any;
  almostLateDeliveriesEntities: Invoices[];
} => {
  const statistics = useQuery({
    queryKey: ["statistics", clientID],
    queryFn: () => StatisticsApiClient.getStatistics(clientID!),
    enabled: !!clientID,
  });

  const { invoices: almostLateDeliveries } = useInvoices({
    query: generateQueryFromMap({
      id: isErrorResponse(statistics.data ?? {})
        ? []
        : (statistics.data as Statistics)?.almostLateDeliveries || [],
    }),
  });

  if (!statistics.data)
    return {
      ...blankStatistics,
      formattedData: [],
      almostLateDeliveriesEntities: [],
    };

  if (isErrorResponse(statistics.data)) {
    return {
      ...blankStatistics,
      formattedData: [],
      almostLateDeliveriesEntities: [],
    };
  }

  const locale = navigator.language;
  const stats = statistics.data.revenueStats;

  const formattedData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(
    (monthNumber) => {
      const foundStat = stats.find(
        (item) => DateTime.fromISO(item.date).month === monthNumber
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

  return {
    ...statistics.data,
    formattedData,
    almostLateDeliveriesEntities: almostLateDeliveries?.data?.list ?? [],
  };
};
