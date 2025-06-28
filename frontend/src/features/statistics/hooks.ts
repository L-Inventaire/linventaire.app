import { useCurrentClient } from "@features/clients/state/use-clients";
import { useNotifications } from "@features/notifications/hooks/use-notifications";
import { useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { StatisticsApiClient } from "./api-client/api-client";
import { DashboardBalances, DashboardTags, Statistics } from "./types";
import { generateQueryFromMap } from "@components/search-bar/utils/utils";

export const useDashboard = (year?: number): Statistics => {
  year = year || DateTime.local().year;
  const { client } = useCurrentClient();
  const { notifications } = useNotifications({
    query: generateQueryFromMap({ read: false }),
    limit: 1,
    key: "unreadNotifications",
  });

  const statistics = useQuery({
    queryKey: ["dashboard", client?.id, year],
    queryFn: () => StatisticsApiClient.getDashboard(client!.id, year),
    enabled: !!client?.id,
  });

  return {
    ...((statistics.data || {}) as Statistics),
    unreadNotifications: notifications?.data?.total || 0,
  };
};

export const useDashboardBalances = (type: "client" | "supplier") => {
  const { client } = useCurrentClient();

  const balances = useQuery<DashboardBalances>({
    queryKey: ["dashboard-balances", client?.id, type],
    queryFn: () => StatisticsApiClient.getBalances(client!.id, type),
    enabled: !!client?.id,
  });

  return balances;
};

export const useDashboardTags = (year?: number) => {
  year = year || DateTime.local().year;
  const { client } = useCurrentClient();

  const tags = useQuery<DashboardTags[]>({
    queryKey: ["dashboard-tags", client?.id, year],
    queryFn: () => StatisticsApiClient.getTags(client!.id, year),
    enabled: !!client?.id,
  });

  return tags;
};
