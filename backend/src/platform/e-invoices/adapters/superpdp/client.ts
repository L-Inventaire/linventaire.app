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
      const res = await this.client.get(
        "https://api.superpdp.tech/v1.beta/invoices/generate_test_invoice?format=en16931",
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      en16931Invoice = {
        ...en16931Invoice,
        payment_due_date: "2026-07-30",
        process_control: {
          business_process_type: "M1",
          specification_identifier: "urn:cen.eu:en16931:2017",
        },
        notes: [
          {
            subject_code: "PMT",
            note: "L’indemnité forfaitaire légale pour frais de recouvrement est de 40 €.",
          },
          {
            subject_code: "PMD",
            note: "À défaut de règlement à la date d’échéance, une pénalité de 10 % du net à payer sera applicable immédiatement.",
          },
          {
            subject_code: "AAB",
            note: "Aucun escompte pour paiement anticipé.",
          },
        ],
        seller: {
          name: "Tricatel",
          identifiers: [
            {
              value: "000000001",
              scheme: "0225",
            },
          ],
          legal_registration_identifier: {
            value: "000000001",
            scheme: "0002",
          },
          vat_identifier: "FR15000000001",
          electronic_address: {
            value: "315143296_3173",
            scheme: "0225",
          },
          postal_address: {
            country_code: "FR",
          },
        },
        buyer: {
          name: "Burger Queen",
          identifiers: [
            {
              value: "000000002",
              scheme: "0225",
            },
          ],
          legal_registration_identifier: {
            value: "000000002",
            scheme: "0002",
          },
          vat_identifier: "FR18000000002",
          electronic_address: {
            value: "315143296_3174",
            scheme: "0225",
          },
          postal_address: {
            country_code: "FR",
          },
        },

        delivery_information: {
          delivery_date: "2025-06-30",
        },
        deliver_to_address: {
          country_code: "FR",
        },
        totals: {
          sum_invoice_lines_amount: "75",
          total_without_vat: "75",
          total_vat_amount: {
            value: "15",
            currency_code: "EUR",
          },
          total_with_vat: "90",
          amount_due_for_payment: "90",
        },
      } as any;
      console.log(
        "[SuperPDPClient.convertToFacturX] Test EN16931 invoice from API:",
        JSON.stringify(en16931Invoice, null, 2)
      );
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
