import { fetchServer } from "../utils/fetch-server";

export type AvailableTable = {
  name: string;
  label: string;
  hasRest: boolean;
};

export type ExportResult = {
  [tableName: string]: any[];
};

export type ImportResult = {
  [tableName: string]: {
    imported: number;
    skipped: number;
    errors: string[];
  };
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

  async importData(
    clientId: string,
    data: ExportResult
  ): Promise<ImportResult> {
    const response = await fetchServer(
      `/api/data-export/v1/${clientId}/import`,
      {
        method: "POST",
        body: JSON.stringify({ data }),
      }
    );
    const result = await response.json();
    return result as ImportResult;
  },
};
