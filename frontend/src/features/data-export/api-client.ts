import { apiClient } from "@config/api-client";

export type AvailableTable = {
  name: string;
  label: string;
  hasRest: boolean;
};

export type ExportResult = {
  [tableName: string]: any[];
};

export const dataExportApiClient = {
  async getAvailableTables(clientId: string): Promise<AvailableTable[]> {
    const response = await apiClient.get(
      `/api/data-export/v1/${clientId}/tables`
    );
    return response.data;
  },

  async exportData(clientId: string, tables: string[]): Promise<ExportResult> {
    const response = await apiClient.post(
      `/api/data-export/v1/${clientId}/export`,
      { tables }
    );
    return response.data;
  },
};
