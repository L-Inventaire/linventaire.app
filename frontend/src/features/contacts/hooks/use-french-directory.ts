import { useState, useEffect } from "react";
import { useClients } from "@features/clients/state/use-clients";
import {
  ContactsApiClient,
  FrenchDirectoryCompany,
  FrenchDirectoryEntry,
  FrenchDirectorySearchOptions,
  FrenchDirectorySearchResult,
} from "../api-client/contacts-api-client";

/**
 * Hook to search French Directory companies by SIREN or name
 */
export const useFrenchDirectorySearch = (
  options?: FrenchDirectorySearchOptions,
) => {
  const { client: clientUser } = useClients();
  const client = clientUser?.client;

  const [result, setResult] = useState<FrenchDirectorySearchResult>({
    data: [],
    has_more: false,
  });
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (searchOptions: FrenchDirectorySearchOptions) => {
    if (!client?.id) return;

    setIsPending(true);
    setError(null);

    try {
      const searchResult = await ContactsApiClient.searchFrenchDirectory(
        client.id,
        searchOptions,
      );
      setResult(searchResult);
    } catch (err: any) {
      setError(err.message || "Failed to search French directory");
      setResult({ data: [], has_more: false });
    } finally {
      setIsPending(false);
    }
  };

  useEffect(() => {
    if (options && client?.id) {
      search(options);
    }
  }, [JSON.stringify(options), client?.id]);

  return {
    companies: result.data,
    has_more: result.has_more,
    isPending,
    error,
    search,
  };
};

/**
 * Hook to get full company details by SIREN
 */
export const useFrenchCompanyBySiren = (siren?: string) => {
  const { client: clientUser } = useClients();
  const client = clientUser?.client;

  const [company, setCompany] = useState<FrenchDirectoryCompany | null>(null);
  const [entries, setEntries] = useState<FrenchDirectoryEntry[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = async (sirenNumber: string) => {
    if (!client?.id || !sirenNumber) return;

    setIsPending(true);
    setError(null);

    try {
      const result = await ContactsApiClient.getFrenchCompanyBySiren(
        client.id,
        sirenNumber,
      );
      setCompany(result.company);
      setEntries(result.entries);
    } catch (err: any) {
      setError(err.message || "Failed to fetch company details");
      setCompany(null);
      setEntries([]);
    } finally {
      setIsPending(false);
    }
  };

  useEffect(() => {
    if (siren && client?.id) {
      fetch(siren);
    } else {
      setCompany(null);
      setEntries([]);
    }
  }, [siren, client?.id]);

  return {
    company,
    entries,
    activeEntries: entries.filter((e) => e.is_active),
    isPending,
    error,
    refetch: () => siren && fetch(siren),
  };
};

/**
 * Hook for manual search with debouncing (useful for search-as-you-type)
 */
export const useFrenchDirectorySearchManual = () => {
  const { client: clientUser } = useClients();
  const client = clientUser?.client;

  const [result, setResult] = useState<FrenchDirectorySearchResult>({
    data: [],
    has_more: false,
  });
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (searchOptions: FrenchDirectorySearchOptions) => {
    if (!client?.id) {
      setError("No client available");
      return;
    }

    setIsPending(true);
    setError(null);

    try {
      const searchResult = await ContactsApiClient.searchFrenchDirectory(
        client.id,
        searchOptions,
      );
      setResult(searchResult);
    } catch (err: any) {
      setError(err.message || "Failed to search French directory");
      setResult({ data: [], has_more: false });
    } finally {
      setIsPending(false);
    }
  };

  const reset = () => {
    setResult({ data: [], has_more: false });
    setError(null);
  };

  return {
    companies: result.data,
    has_more: result.has_more,
    isPending,
    error,
    search,
    reset,
  };
};
