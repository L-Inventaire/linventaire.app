import axios, { AxiosInstance } from "axios";
import { EN16931Invoice } from "./en16931-types";

export interface SuperPDPConfig {
  clientId: string;
  clientSecret: string;
  environment?: "sandbox" | "production";
}

export interface SuperPDPCompanyResponse {
  id: number;
  formal_name: string;
  trade_name: string;
  number: string;
  number_scheme: string;
  env: "sandbox" | "production";
  address: string;
  city: string;
  postcode: string;
  country: string;
  created_at: string;
  mandates?: Array<{
    id: number;
    managed_public_company_formal_name: string;
    managed_public_company_number: string;
    owner_id: number;
    created_at: string;
  }>;
}

export interface SuperPDPDirectoryEntry {
  id: number;
  directory: "peppol" | "ppf";
  identifier: string;
  status: "pending" | "created" | "error";
  status_message: string;
  is_replyto: boolean;
  created_at: string;
}

export interface SuperPDPInvoice {
  id: number;
  direction: "in" | "out";
  status: string[];
  created_at: string;
  en_invoice?: EN16931Invoice;
}

export class SuperPDPClient {
  private client: AxiosInstance;
  private accessToken?: string;

  constructor(private config: SuperPDPConfig) {
    this.client = axios.create({
      baseURL: "https://api.superpdp.tech",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Authenticate and get access token
   */
  async authenticate(): Promise<string> {
    try {
      const params = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      });

      const response = await this.client.post(
        "/oauth2/token",
        params.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      this.accessToken = response.data.access_token;
      return this.accessToken || "";
    } catch (error: any) {
      throw new Error(
        `SuperPDP authentication failed: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  /**
   * Get current company information
   */
  async getCompanyInfo(): Promise<SuperPDPCompanyResponse> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    try {
      const response = await this.client.get("/v1.beta/companies/me", {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      return response.data;
    } catch (error: any) {
      // If 401, try to re-authenticate
      if (error.response?.status === 401) {
        await this.authenticate();
        const response = await this.client.get("/v1.beta/companies/me", {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        });
        return response.data;
      }

      throw new Error(
        `Failed to get company info: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  /**
   * Get directory entries for the company
   */
  async getDirectoryEntries(): Promise<SuperPDPDirectoryEntry[]> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    try {
      const response = await this.client.get("/v1.beta/directory_entries", {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      const entries = response.data.data || [];
      console.log("[SuperPDPClient.getDirectoryEntries] Retrieved from API:", {
        count: entries.length,
        entries: entries,
      });

      return entries;
    } catch (error: any) {
      // If 401, try to re-authenticate
      if (error.response?.status === 401) {
        await this.authenticate();
        const response = await this.client.get("/v1.beta/directory_entries", {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        });
        const entries = response.data.data || [];
        console.log(
          "[SuperPDPClient.getDirectoryEntries] Retrieved from API (after re-auth):",
          {
            count: entries.length,
            entries: entries,
          }
        );
        return entries;
      }

      throw new Error(
        `Failed to get directory entries: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  /**
   * Get received invoices (direction=in)
   */
  async getReceivedInvoices(options?: {
    limit?: number;
    startingAfterId?: number;
  }): Promise<SuperPDPInvoice[]> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    try {
      const params = new URLSearchParams({
        direction: "in",
        limit: (options?.limit || 100).toString(),
        order: "desc",
        ...(options?.startingAfterId
          ? { starting_after_id: options.startingAfterId.toString() }
          : {}),
      });

      // Request with expand to get full invoice data
      const response = await this.client.get(
        `/v1.beta/invoices?${params.toString()}&expand[]=en_invoice`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      return response.data.data || [];
    } catch (error: any) {
      // If 401, try to re-authenticate
      if (error.response?.status === 401) {
        await this.authenticate();
        const params = new URLSearchParams({
          direction: "in",
          limit: (options?.limit || 100).toString(),
          order: "desc",
          ...(options?.startingAfterId
            ? { starting_after_id: options.startingAfterId.toString() }
            : {}),
        });

        const response = await this.client.get(
          `/v1.beta/invoices?${params.toString()}&expand[]=en_invoice`,
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
            },
          }
        );
        return response.data.data || [];
      }

      throw new Error(
        `Failed to get received invoices: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  /**
   * Test connection to SuperPDP
   */
  async testConnection(): Promise<{
    success: boolean;
    company?: SuperPDPCompanyResponse;
    directoryEntries?: SuperPDPDirectoryEntry[];
    error?: string;
  }> {
    try {
      await this.authenticate();
      const company = await this.getCompanyInfo();
      const directoryEntries = await this.getDirectoryEntries();

      console.log("[SuperPDPClient.testConnection] Retrieved data:", {
        company_id: company.id,
        directory_entries_count: directoryEntries.length,
        directory_entries: directoryEntries,
      });

      return {
        success: true,
        company,
        directoryEntries,
      };
    } catch (error: any) {
      console.error("[SuperPDPClient.testConnection] Error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
