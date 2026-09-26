import axios, { AxiosInstance } from "axios";
import crypto from "crypto";
import { EN16931Invoice } from "@shared/en16931-types";

export const SUPERPDP_BASE_URL = "https://api.superpdp.tech";

export interface SuperPDPConfig {
  clientId: string;
  clientSecret: string;
  environment?: "sandbox" | "production";
  /**
   * When set, access tokens come from this provider (authorization_code flow,
   * acting on behalf of a company) instead of the client_credentials grant.
   * `staleToken` is the token that was just rejected (401), if any.
   */
  tokenProvider?: (staleToken?: string) => Promise<string>;
}

export interface SuperPDPTokenSet {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
}

export interface SuperPDPSession {
  client_id: string;
  // Anything other than "verified" means most routes answer 403
  company_verification_status: string;
  user_identity_verification_status?: string;
  [key: string]: any;
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
      baseURL: SUPERPDP_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * PKCE verifier (43-128 url-safe chars) and its S256 challenge
   */
  static createPkcePair(): { verifier: string; challenge: string } {
    const verifier = crypto.randomBytes(64).toString("base64url");
    const challenge = crypto
      .createHash("sha256")
      .update(verifier)
      .digest("base64url");
    return { verifier, challenge };
  }

  /**
   * URL of SuperPDP's hosted onboarding (account creation, KYC/KYB, consent).
   * The user is redirected back to `redirectUri` with `code` and `state`.
   */
  static getAuthorizeUrl(options: {
    clientId: string;
    redirectUri: string;
    codeChallenge: string;
    state: string;
    loginHint?: string;
    companyNumber?: string; // SIREN
  }): string {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: options.clientId,
      redirect_uri: options.redirectUri,
      code_challenge: options.codeChallenge,
      code_challenge_method: "S256",
      state: options.state,
    });
    if (options.loginHint) params.append("login_hint", options.loginHint);
    if (options.companyNumber) {
      params.append("superpdp_company_number", options.companyNumber);
      params.append("superpdp_company_number_scheme", "fr_siren");
    }
    return `${SUPERPDP_BASE_URL}/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Exchange an authorization code (or a refresh token) for a token set.
   * Refresh tokens rotate: always persist the returned one.
   */
  static async requestToken(
    form:
      | {
          grant_type: "authorization_code";
          code: string;
          code_verifier: string;
          redirect_uri: string;
        }
      | { grant_type: "refresh_token"; refresh_token: string },
    app: { clientId: string; clientSecret: string }
  ): Promise<SuperPDPTokenSet> {
    try {
      const params = new URLSearchParams({
        ...form,
        client_id: app.clientId,
        client_secret: app.clientSecret,
      });
      const response = await axios.post(
        `${SUPERPDP_BASE_URL}/oauth2/token`,
        params.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
        }
      );
      if (!response.data?.access_token) {
        throw new Error("Token endpoint did not return an access_token");
      }
      return response.data;
    } catch (error: any) {
      const data = error.response?.data;
      throw new Error(
        `SuperPDP ${form.grant_type} failed: ${
          data?.error_description ||
          data?.error ||
          data?.message ||
          error.message
        }`
      );
    }
  }

  /**
   * Authenticate and get access token
   */
  async authenticate(): Promise<string> {
    if (this.config.tokenProvider) {
      this.accessToken = await this.config.tokenProvider(this.accessToken);
      return this.accessToken;
    }

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
   * Get the OAuth2 session bound to the current access token.
   * Use it to know if the company went through SuperPDP's verification.
   */
  async getSession(): Promise<SuperPDPSession> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    const get = () =>
      this.client.get("/v1.beta/oauth2_sessions/me", {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

    try {
      return (await get()).data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        await this.authenticate();
        return (await get()).data;
      }

      throw new Error(
        `Failed to get session: ${
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
   * Create (send) an invoice: SuperPDP queues it for asynchronous transmission.
   * Success only means the payload is structurally valid, follow the invoice
   * events to know if the transmission actually succeeded.
   *
   * @param facturXPdf - The Factur-X PDF to send
   * @param externalId - Our own id for the invoice (max 36 chars)
   */
  async sendInvoice(
    facturXPdf: Buffer,
    externalId?: string
  ): Promise<SuperPDPInvoice> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    const params = new URLSearchParams();
    if (externalId) params.append("external_id", externalId.slice(0, 36));

    try {
      const response = await this.client.post(
        `/v1.beta/invoices?${params.toString()}`,
        facturXPdf,
        {
          headers: {
            "Content-Type": "application/pdf",
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      // If 401, try to re-authenticate
      if (error.response?.status === 401) {
        await this.authenticate();
        const response = await this.client.post(
          `/v1.beta/invoices?${params.toString()}`,
          facturXPdf,
          {
            headers: {
              "Content-Type": "application/pdf",
              Authorization: `Bearer ${this.accessToken}`,
            },
          }
        );
        return response.data;
      }

      throw new Error(
        `Failed to send invoice: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  /**
   * Validate an EN16931 invoice
   */
  async validateInvoice(
    en16931Invoice: EN16931Invoice
  ): Promise<{ valid: boolean; report: any }> {
    const FormData = (await import("form-data")).default;
    const formData = new FormData();

    const jsonBuffer = Buffer.from(JSON.stringify(en16931Invoice), "utf-8");
    formData.append("invoices", jsonBuffer, {
      filename: "invoice.json",
      contentType: "application/json",
    });

    try {
      const response = await this.client.post(
        "/v1.beta/validation_reports",
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      const rawData = response.data;
      const report = rawData.data || rawData;

      // Check if valid: if no errors in subreport messages
      const hasErrors =
        report.subreport?.messages?.some(
          (message: any) => message.level === "error"
        ) || false;
      const valid = !hasErrors;

      return { valid, report };
    } catch (error: any) {
      // If 401, try to re-authenticate
      if (error.response?.status === 401) {
        await this.authenticate();
        return this.validateInvoice(en16931Invoice);
      }

      throw new Error(
        `Failed to validate invoice: ${
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
