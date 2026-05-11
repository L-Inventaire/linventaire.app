import { fetchServer } from "@features/utils/fetch-server";
import { Contacts } from "../types/types";

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

export interface FrenchDirectoryFullResult {
  company: FrenchDirectoryCompany | null;
  entries: FrenchDirectoryEntry[];
}

export class ContactsApiClient {
  static get = async (clientID: string, contactID: string) => {
    const response = await fetchServer(
      `/api/rest/v1/${clientID}/contacts/${contactID}`,
    );
    const data = await response.json();
    return data as Contacts;
  };

  static getSireneData = async (
    clientId: string,
    siret: string,
  ): Promise<
    Partial<{
      siret: string;
      address: {
        address_line_1: string;
        address_line_2: string;
        city: string;
        region: string;
        country: string;
        zip: string;
      };
      name: string;
    }>
  > => {
    if (siret.length < 14) return {};
    return await (
      await fetchServer(
        `/api/contacts/v1/clients/${clientId}/sirene/` +
          siret
            .toLocaleUpperCase()
            .replace(/[^A-Z0-9]/gm, "")
            .slice(0, 14),
      )
    ).json();
  };

  /**
   * Search French Directory companies by SIREN or name
   */
  static searchFrenchDirectory = async (
    clientId: string,
    options: FrenchDirectorySearchOptions,
  ): Promise<FrenchDirectorySearchResult> => {
    const params = new URLSearchParams();
    if (options.formal_name_starts_with) {
      params.append("formal_name_starts_with", options.formal_name_starts_with);
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

    const response = await fetchServer(
      `/api/contacts/v1/clients/${clientId}/french-directory/search?${params.toString()}`,
    );
    return await response.json();
  };

  /**
   * Get full company details by SIREN (company info + directory entries)
   */
  static getFrenchCompanyBySiren = async (
    clientId: string,
    siren: string,
  ): Promise<FrenchDirectoryFullResult> => {
    const response = await fetchServer(
      `/api/contacts/v1/clients/${clientId}/french-directory/${siren}`,
    );
    return await response.json();
  };
}
