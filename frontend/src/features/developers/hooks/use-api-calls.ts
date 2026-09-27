import { useQuery } from "@tanstack/react-query";
import {
  ApiCallsApiClient,
  ApiCallsFilters,
} from "../api-client/developers-api-client";

export const useApiCalls = (
  clientId: string,
  filters: ApiCallsFilters & { limit: number; offset: number },
) =>
  useQuery({
    queryKey: ["api_calls", clientId, filters],
    queryFn: () => ApiCallsApiClient.list(clientId, filters),
    enabled: !!clientId,
  });

export const useApiCallsStats = (clientId: string, filters: ApiCallsFilters) =>
  useQuery({
    queryKey: ["api_calls_stats", clientId, filters.all, filters.api_key_id],
    queryFn: () => ApiCallsApiClient.stats(clientId, filters),
    enabled: !!clientId,
  });

export const useApiCall = (clientId: string, id: string | null) =>
  useQuery({
    queryKey: ["api_call", clientId, id],
    queryFn: () => ApiCallsApiClient.get(clientId, id as string),
    enabled: !!id,
  });
