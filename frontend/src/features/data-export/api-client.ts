import { fetchServer } from "../utils/fetch-server";

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
    const response = await fetchServer(
      `/api/data-export/v1/${clientId}/tables`,
      {
        method: "GET",
      }
    );
    const data = await response.json();
    return data as AvailableTable[];
  },

  async exportData(clientId: string, tables: string[]): Promise<ExportResult> {
    const response = await fetchServer(
      `/api/data-export/v1/${clientId}/export`,
      {
        method: "POST",
        body: JSON.stringify({ tables }),
      }
    );
    const data = await response.json();
    return data as ExportResult;
  },
};
