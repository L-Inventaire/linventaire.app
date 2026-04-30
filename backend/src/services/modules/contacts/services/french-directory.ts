import { Context } from "src/types";
import { SuperPDPClient } from "../../../../platform/e-invoices/adapters/superpdp/client";
import {
  FrenchDirectoryCompany,
  FrenchDirectoryEntry,
  FrenchDirectorySearchOptions,
  FrenchDirectorySearchResult,
} from "../../../../platform/e-invoices/adapters/superpdp/client";

/**
 * Search French Directory companies by SIREN or name
 * Note: This endpoint does not require authentication
 */
export const searchFrenchDirectoryCompanies = async (
  ctx: Context,
  options: FrenchDirectorySearchOptions
): Promise<FrenchDirectorySearchResult> => {
  // French Directory API doesn't require authentication, so we can create a client without credentials
  const client = new SuperPDPClient({
    clientId: "",
    clientSecret: "",
  });

  return await client.searchFrenchDirectoryCompanies(options);
};

/**
 * Get directory entries for a French company by SIREN
 * Note: This endpoint does not require authentication
 */
export const getFrenchDirectoryEntries = async (
  ctx: Context,
  siren: string
): Promise<FrenchDirectoryEntry[]> => {
  const client = new SuperPDPClient({
    clientId: "",
    clientSecret: "",
  });

  return await client.getFrenchDirectoryEntries(siren);
};

/**
 * Get full company details by SIREN (company info + directory entries)
 */
export const getFrenchCompanyBySiren = async (
  ctx: Context,
  siren: string
): Promise<{
  company: FrenchDirectoryCompany | null;
  entries: FrenchDirectoryEntry[];
}> => {
  const client = new SuperPDPClient({
    clientId: "",
    clientSecret: "",
  });

  return await client.getFrenchCompanyBySiren(siren);
};
