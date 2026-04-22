import { fetchServer } from "@features/utils/fetch-server";
import {
  EInvoicingConfig,
  SaveConfigRequest,
  TestConnectionResponse,
  UpdateSettingsRequest,
} from "../types/types";

export class EInvoicingApiClient {
  /**
   * Get e-invoicing configuration for a client
   */
  static async getConfig(
    clientId: string,
  ): Promise<{ config: EInvoicingConfig | null }> {
    const response = await fetchServer(`/api/e-invoices/v1/${clientId}/config`);
    const data = await response.json();
    console.log("[EInvoicingApiClient.getConfig] Received from server:", {
      has_config: !!data.config,
      directory_entries_count:
        data.config?.superpdp_directory_entries?.length || 0,
      directory_entries: data.config?.superpdp_directory_entries,
    });
    return data;
  }

  /**
   * Save e-invoicing configuration (create or update)
   */
  static async saveConfig(
    clientId: string,
    data: SaveConfigRequest,
  ): Promise<{ config: EInvoicingConfig }> {
    const response = await fetchServer(
      `/api/e-invoices/v1/${clientId}/config`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
    return await response.json();
  }

  /**
   * Test connection to SuperPDP
   */
  static async testConnection(
    clientId: string,
  ): Promise<TestConnectionResponse> {
    const response = await fetchServer(
      `/api/e-invoices/v1/${clientId}/test-connection`,
      {
        method: "POST",
      },
    );
    const data = await response.json();
    console.log("[EInvoicingApiClient.testConnection] Response:", {
      success: data.success,
      company_id: data.company?.id,
      error: data.error,
    });
    return data;
  }

  /**
   * Delete e-invoicing configuration
   */
  static async deleteConfig(clientId: string): Promise<{ success: boolean }> {
    const response = await fetchServer(
      `/api/e-invoices/v1/${clientId}/config`,
      {
        method: "DELETE",
      },
    );
    return await response.json();
  }

  /**
   * Update send/receive settings
   */
  static async updateSettings(
    clientId: string,
    data: UpdateSettingsRequest,
  ): Promise<{ config: EInvoicingConfig }> {
    const response = await fetchServer(
      `/api/e-invoices/v1/${clientId}/settings`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    );
    return await response.json();
  }

  /**
   * Sync company info and directory entries from SuperPDP
   */
  static async syncData(
    clientId: string,
  ): Promise<{ success: boolean; config: EInvoicingConfig }> {
    const response = await fetchServer(`/api/e-invoices/v1/${clientId}/sync`, {
      method: "POST",
    });
    const data = await response.json();
    console.log("[EInvoicingApiClient.syncData] Synced data:", {
      success: data.success,
      directory_entries_count:
        data.config?.superpdp_directory_entries?.length || 0,
    });
    return data;
  }
}
