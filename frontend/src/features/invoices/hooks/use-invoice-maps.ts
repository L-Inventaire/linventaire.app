import { useQuery } from "@tanstack/react-query";
import { fetchServer } from "@features/utils/fetch-server";
import { useCurrentClient } from "@features/clients/state/use-clients";

export type InvoiceMaps = {
  units: Record<string, string>;
  vat: Record<string, string>;
  vat_values: Record<string, number>;
  vat_exemption: Record<string, string>;
};

let cachedMaps: InvoiceMaps | null = null;

export const getInvoiceMaps = () => {
  return cachedMaps;
};

export const useInvoiceMaps = () => {
  const { client } = useCurrentClient();

  const query = useQuery({
    queryKey: ["invoice-maps", client?.id],
    queryFn: async (): Promise<InvoiceMaps> => {
      const response = await fetchServer("/api/invoices/v1/maps");
      const data = await response.json();
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!client?.id,
  });

  cachedMaps = query.data || cachedMaps;

  // Transform vat_exemption into options format for dropdown
  const tvaMentionOptions = query.data?.vat_exemption
    ? Object.entries(query.data.vat_exemption).map(([key, label]) => ({
        value: key,
        label: label,
      }))
    : [];

  // Transform vat categories into options format for dropdown
  const tvaOptions = query.data?.vat
    ? Object.entries(query.data.vat).map(([key, label]) => ({
        value: key,
        label: label,
      }))
    : [];

  // Transform units into options format for dropdown
  const unitOptions = query.data?.units
    ? Object.entries(query.data.units).map(([key, label]) => ({
        value: key,
        label: label,
      }))
    : [];

  return {
    ...query,
    tvaMentionOptions,
    tvaOptions,
    unitOptions,
    maps: query.data,
  };
};
