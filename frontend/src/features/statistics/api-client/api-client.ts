import { fetchServer } from "@features/utils/fetch-server";

import { StandardOrErrorResponse } from "@features/utils/rest/types/types";
import {
  AccountingExportLine,
  ClientProfitabilityResult,
  Dashboard,
  DashboardBalances,
  DashboardTags,
  TimeRange,
} from "../types";

export class StatisticsApiClient {
  static getDashboard = async (
    clientId: string,
    year?: number
  ): Promise<StandardOrErrorResponse<Dashboard>> => {
    const uri = `/api/statistics/v1/${clientId}/dashboard?year=${year}`;
    const response = await fetchServer(uri);
    const data = await response.json();
    return data;
  };

  static getTags = async (
    clientId: string,
    year?: number
  ): Promise<StandardOrErrorResponse<DashboardTags[]>> => {
    const uri = `/api/statistics/v1/${clientId}/dashboard/tags?date=${year}`;
    const response = await fetchServer(uri);
    const data = await response.json();
    return data;
  };

  static getBalances = async (
    clientId: string,
    type: "client" | "supplier"
  ): Promise<StandardOrErrorResponse<DashboardBalances>> => {
    const uri = `/api/statistics/v1/${clientId}/dashboard/balances?type=${type}`;
    const response = await fetchServer(uri);
    const data = await response.json();
    return data;
  };

  static getAccountingExport = async (
    clientId: string,
    options: {
      from?: string;
      to?: string;
      type?:
        | "invoices"
        | "credit_notes"
        | "supplier_invoices"
        | "supplier_credit_notes"
        | "all";
      state?: "all" | "sent" | "closed";
    }
  ): Promise<StandardOrErrorResponse<AccountingExportLine[]>> => {
    const params = new URLSearchParams();
    if (options.from) params.append("from", options.from);
    if (options.to) params.append("to", options.to);
    if (options.type) params.append("type", options.type);
    const uri = `/api/statistics/v1/${clientId}/accounting-export?${params.toString()}`;
    const response = await fetchServer(uri);
    const data = await response.json();
    return data;
  };

  static getClientProfitability = async (
    clientId: string,
    options: {
      timeRanges: TimeRange[];
      clientIds?: string[];
    }
  ): Promise<StandardOrErrorResponse<ClientProfitabilityResult[]>> => {
    const uri = `/api/statistics/v1/${clientId}/client-profitability`;
    const response = await fetchServer(uri, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options),
    });
    const data = await response.json();
    return data;
  };
}
