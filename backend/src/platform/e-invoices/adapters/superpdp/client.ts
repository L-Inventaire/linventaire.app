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

export interface FrenchDirectoryCompany {
  number: string; // SIREN
  formal_name: string;
  address: string;
  postcode: string;
  city: string;
  country: string;
}

export interface FrenchDirectoryEntry {
  company: FrenchDirectoryCompany;
  identifier: string; // Peppol address format: 0225:{siren}*
  is_active: boolean;
}

export interface FrenchDirectorySearchOptions {
  formal_name_starts_with?: string;
  post_code_starts_with?: string;
  number?: string; // SIREN
  limit?: number; // max 1000, default 100
}

export interface FrenchDirectorySearchResult {
  data: FrenchDirectoryCompany[];
  has_more: boolean;
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
   * Get a single invoice by ID (returns full en_invoice data)
   */
  async getInvoice(invoiceId: number): Promise<SuperPDPInvoice> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    try {
      const response = await this.client.get(`/v1.beta/invoices/${invoiceId}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      return response.data;
    } catch (error: any) {
      // If 401, try to re-authenticate
      if (error.response?.status === 401) {
        await this.authenticate();
        const response = await this.client.get(
          `/v1.beta/invoices/${invoiceId}`,
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
            },
          }
        );
        return response.data;
      }

      throw new Error(
        `Failed to get invoice ${invoiceId}: ${
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

      // Request with expand to get full invoice data including seller and buyer
      const response = await this.client.get(
        `/v1.beta/invoices?${params.toString()}&expand[]=en_invoice&expand[]=en_invoice.seller&expand[]=en_invoice.buyer&expand[]=en_invoice.lines`,
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
          `/v1.beta/invoices?${params.toString()}&expand[]=en_invoice&expand[]=en_invoice.seller&expand[]=en_invoice.buyer&expand[]=en_invoice.lines`,
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
   * Convert PDF and EN16931 invoice data to Factur-X PDF
   *
   * @param pdfBuffer - The base PDF file
   * @param en16931Invoice - The EN16931 invoice data to embed
   * @param options - Conversion options
   * @returns The Factur-X PDF buffer
   */
  async convertToFacturX(
    pdfBuffer: Buffer,
    en16931Invoice: EN16931Invoice
  ): Promise<Buffer> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    try {
      const FormData = (await import("form-data")).default;
      const formData = new FormData();

      console.log("[SuperPDPClient.convertToFacturX] Creating multipart:", {
        invoiceNumber: en16931Invoice.number,
        pdfSize: pdfBuffer.length,
      });

      // Add PDF file (field name must be 'pdf' per API spec)
      formData.append("pdf", pdfBuffer, {
        filename: "invoice.pdf",
        contentType: "application/pdf",
      });

      // Add EN16931 invoice as JSON (field name must be 'invoice' per API spec)
      const jsonBuffer = Buffer.from(JSON.stringify(en16931Invoice), "utf-8");
      formData.append("invoice", jsonBuffer, {
        filename: "invoice.json",
        contentType: "application/json",
      });

      // Send multipart request with from=en16931&to=factur-x
      const response = await this.client.post(
        "/v1.beta/invoices/convert?from=en16931&to=factur-x",
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${this.accessToken}`,
          },
          responseType: "arraybuffer",
        }
      );

      return Buffer.from(response.data);
    } catch (error: any) {
      // Log detailed error information
      console.error("[SuperPDPClient.convertToFacturX] Error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        headers: error.response?.headers,
        data: error.response?.data,
        message: error.message,
      });

      // Try to parse error response (might be JSON or text)
      let errorMessage = error.message;
      if (error.response?.data) {
        try {
          // If data is a Buffer, try to convert to string
          const dataStr =
            error.response.data instanceof Buffer
              ? error.response.data.toString("utf-8")
              : error.response.data;
          console.error(
            "[SuperPDPClient.convertToFacturX] Response data:",
            dataStr
          );

          // Try to parse as JSON
          const jsonData = JSON.parse(dataStr);
          errorMessage = jsonData.message || jsonData.error || errorMessage;
          console.error(
            "[SuperPDPClient.convertToFacturX] Parsed error:",
            jsonData
          );
        } catch (parseError) {
          // Not JSON, use as-is
          console.error(
            "[SuperPDPClient.convertToFacturX] Could not parse error response"
          );
        }
      }

      // If 401, try to re-authenticate
      if (error.response?.status === 401) {
        console.log(
          "[SuperPDPClient.convertToFacturX] Re-authenticating after 401..."
        );
        await this.authenticate();

        const FormData = (await import("form-data")).default;
        const formData = new FormData();

        formData.append("pdf", pdfBuffer, {
          filename: "invoice.pdf",
          contentType: "application/pdf",
        });

        const jsonBuffer = Buffer.from(JSON.stringify(en16931Invoice), "utf-8");
        formData.append("invoice", jsonBuffer, {
          filename: "invoice.json",
          contentType: "application/json",
        });

        const response = await this.client.post(
          "/v1.beta/invoices/convert?from=en16931&to=factur-x",
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              Authorization: `Bearer ${this.accessToken}`,
            },
            responseType: "arraybuffer",
          }
        );

        return Buffer.from(response.data);
      }

      throw new Error(`Failed to convert to Factur-X: ${errorMessage}`);
    }
  }

  /**
   * Search French Directory companies by SIREN or name
   * Note: This endpoint does not require authentication
   *
   * @param options - Search criteria
   * @returns List of companies matching the search criteria
   */
  async searchFrenchDirectoryCompanies(
    options: FrenchDirectorySearchOptions
  ): Promise<FrenchDirectorySearchResult> {
    try {
      const params = new URLSearchParams();

      if (options.formal_name_starts_with) {
        params.append(
          "formal_name_starts_with",
          options.formal_name_starts_with
        );
      }
      if (options.post_code_starts_with) {
        params.append("post_code_starts_with", options.post_code_starts_with);
      }
      if (options.number) {
        params.append("number", options.number);
      }
      if (options.limit) {
        params.append("limit", options.limit.toString());
      }

      console.log(
        "[SuperPDPClient.searchFrenchDirectoryCompanies] Searching with:",
        {
          options,
          params: params.toString(),
        }
      );

      const response = await this.client.get(
        `/v1.beta/french_directory/companies?${params.toString()}`
      );

      console.log("[SuperPDPClient.searchFrenchDirectoryCompanies] Results:", {
        count: response.data.data?.length || 0,
        has_more: response.data.has_more,
      });

      return {
        data: response.data.data || [],
        has_more: response.data.has_more || false,
      };
    } catch (error: any) {
      throw new Error(
        `Failed to search French directory companies: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  /**
   * Get directory entries for a French company by SIREN
   * Note: This endpoint does not require authentication
   *
   * @param siren - The SIREN number of the company
   * @returns List of directory entries (Peppol addresses) for the company
   */
  async getFrenchDirectoryEntries(
    siren: string
  ): Promise<FrenchDirectoryEntry[]> {
    try {
      console.log(
        "[SuperPDPClient.getFrenchDirectoryEntries] Getting entries for SIREN:",
        siren
      );

      const response = await this.client.get(
        `/v1.beta/french_directory/entries?number=${encodeURIComponent(siren)}`
      );

      const entries = response.data.data || [];
      console.log(
        "[SuperPDPClient.getFrenchDirectoryEntries] Retrieved entries:",
        {
          siren,
          count: entries.length,
          entries: entries,
        }
      );

      return entries;
    } catch (error: any) {
      throw new Error(
        `Failed to get French directory entries for SIREN ${siren}: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  /**
   * Get full company details by SIREN (company info + directory entries)
   *
   * @param siren - The SIREN number of the company
   * @returns Company information and its directory entries
   */
  async getFrenchCompanyBySiren(siren: string): Promise<{
    company: FrenchDirectoryCompany | null;
    entries: FrenchDirectoryEntry[];
  }> {
    try {
      console.log(
        "[SuperPDPClient.getFrenchCompanyBySiren] Looking up SIREN:",
        siren
      );

      // Search for the company by exact SIREN
      const searchResult = await this.searchFrenchDirectoryCompanies({
        number: siren,
        limit: 1,
      });

      const company =
        searchResult.data.length > 0 ? searchResult.data[0] : null;

      if (!company) {
        console.log(
          "[SuperPDPClient.getFrenchCompanyBySiren] Company not found for SIREN:",
          siren
        );
        return { company: null, entries: [] };
      }

      // Get directory entries for the company
      const entries = await this.getFrenchDirectoryEntries(siren);

      console.log(
        "[SuperPDPClient.getFrenchCompanyBySiren] Complete data retrieved:",
        {
          siren,
          company: company.formal_name,
          entries_count: entries.length,
        }
      );

      return { company, entries };
    } catch (error: any) {
      throw new Error(
        `Failed to get French company by SIREN ${siren}: ${
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
