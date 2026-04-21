import axios, { AxiosInstance } from "axios";

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
      console.log("Authenticating with SuperPDP...", this.config);

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
   * Test connection to SuperPDP
   */
  async testConnection(): Promise<{
    success: boolean;
    company?: SuperPDPCompanyResponse;
    error?: string;
  }> {
    try {
      await this.authenticate();
      const company = await this.getCompanyInfo();

      return {
        success: true,
        company,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
