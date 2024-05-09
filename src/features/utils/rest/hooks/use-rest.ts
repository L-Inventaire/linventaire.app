import { useCurrentClient } from "@features/clients/state/use-clients";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import _ from "lodash";
import { useEffect, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { RestApiClient } from "../api-client/rest-api-client";

const restApiClients: { [key: string]: RestApiClient<any> } = {};

export type RestSearchQueryOp = "equals" | "regex" | "gte" | "lte" | "range";

export type RestSearchQuery = {
  key: string;
  not?: boolean;
  values: { op: RestSearchQueryOp; value: any }[];
};

export type RestOptions<T> = {
  query?: RestSearchQuery[] | Partial<T>;
  limit?: number;
  offset?: number;
  asc?: boolean;
  index?: string;
  key?: string;
};

export const useRestSuggestions = <T>(
  table: string,
  column: string,
  query?: string
) => {
  restApiClients[table] = restApiClients[table] || new RestApiClient(table);
  const restApiClient = restApiClients[table] as RestApiClient<T>;
  const { id } = useCurrentClient();

  const [loading, setLoading] = useState(false);
  const [debouncedQuery, setQuery] = useDebounceValue(query, 500);
  const [suggestions, setSuggestions] = useState<
    {
      value: any;
      label?: string;
      item?: any;
      count?: number;
      updated?: number;
    }[]
  >([]);

  useEffect(() => {
    setLoading(true);
    setQuery(query);
  }, [query]);

  const suggestionsQuery = useQuery({
    queryKey: [table + "-suggestions", id, column, query ? debouncedQuery : ""],
    staleTime: !query ? 1000 * 60 * 5 : 1000, // 5 minutes
    queryFn: async () => {
      if (column) {
        return restApiClient.suggestions(
          id || "",
          column,
          query ? debouncedQuery : ""
        );
      }
      return [];
    },
  });

  useEffect(() => {
    if (suggestionsQuery.isFetched) {
      setLoading(false);
      setSuggestions(suggestionsQuery.data || []);
    }
  }, [suggestionsQuery.data]);

  return {
    suggestions: {
      ...suggestionsQuery,
      data: suggestions,
      isPending: loading || suggestionsQuery.isPending,
    },
  };
};

export const useRest = <T>(table: string, options?: RestOptions<T>) => {
  restApiClients[table] = restApiClients[table] || new RestApiClient(table);
  const restApiClient = restApiClients[table] as RestApiClient<T>;
  const { id } = useCurrentClient();
  const queryClient = useQueryClient();

  const items = useQuery({
    queryKey: [table, id, options?.key || "default"],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: () =>
      options?.limit === 0
        ? { total: 0, list: [] }
        : restApiClient.list(
            id || "",
            options?.query,
            _.omit(options, "query")
          ),
  });

  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: [table, id, ...(options?.key ? [options?.key] : [])],
    });

  const remove = useMutation({
    mutationFn: (itemId: string) => restApiClient.delete(id || "", itemId),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [table, id],
      });
    },
  });

  const create = useMutation({
    mutationFn: (item: Partial<T>) => restApiClient.create(id || "", item),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [table, id],
      });
    },
  });

  const update = useMutation({
    mutationFn: (item: Partial<T>, itemId?: string) =>
      restApiClient.update(id || "", item, itemId),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [table, id],
      });
    },
  });

  const upsert = useMutation({
    mutationFn: (item: Partial<T>, itemId?: string) =>
      (item as any)?.id || itemId
        ? restApiClient.update(id || "", item, itemId)
        : restApiClient.create(id || "", item),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [table, id],
      });
    },
  });

  return { refresh, items, remove, create, update, upsert };
};

export const useRestSchema = (table: string) => {
  const { id } = useCurrentClient();
  return useQuery({
    queryKey: [table + "_schema", id],
    queryFn: () => restApiClients[table].schema(id || ""),
  });
};
