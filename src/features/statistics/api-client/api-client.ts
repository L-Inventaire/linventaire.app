import { fetchServer } from "@features/utils/fetch-server";

import { StandardOrErrorResponse } from "@features/utils/rest/types/types";
import { Dashboard, DashboardBalances, DashboardTags } from "../types";

export class StatisticsApiClient {
  static getDashboard = async (
    clientId: string,
    year?: number
  ): Promise<StandardOrErrorResponse<Dashboard>> => {
    let uri = `/api/statistics/v1/${clientId}/dashboard?year=${year}`;
    const response = await fetchServer(uri);
    const data = await response.json();
    return data;
  };

  static getTags = async (
    clientId: string,
    year?: number
  ): Promise<StandardOrErrorResponse<DashboardTags>> => {
    let uri = `/api/statistics/v1/${clientId}/dashboard/tags?date=${year}`;
    const response = await fetchServer(uri);
    const data = await response.json();
    return data;
  };

  static getBalances = async (
    clientId: string,
    type: "client" | "supplier"
  ): Promise<StandardOrErrorResponse<DashboardBalances>> => {
    let uri = `/api/statistics/v1/${clientId}/dashboard/balances?type=${type}`;
    const response = await fetchServer(uri);
    const data = await response.json();
    return data;
  };
}
