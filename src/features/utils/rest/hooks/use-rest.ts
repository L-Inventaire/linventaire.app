import { useCurrentClient } from "@features/clients/state/use-clients";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import _ from "lodash";
import { useEffect, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { RestApiClient } from "../api-client/rest-api-client";
import { SchemaType } from "../types/types";

const restApiClients: { [key: string]: RestApiClient<any> } = {};

export type RestSearchQueryOp = "equals" | "regex" | "gte" | "lte" | "range";

export type RestSearchQuery = {
  key: string;
  not?: boolean;
  values: { op: RestSearchQueryOp; value: any }[];
};

export type RestOptions<T> = {
  //Use when selecting a specific object
  id?: string;

  // For search
  query?: RestSearchQuery[] | Partial<T>;
  limit?: number;
  offset?: number;
  asc?: boolean;
  index?: string;
  key?: string;
  queryFn?: () => Promise<{ total: number; list: T[] }>;
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
    placeholderData: (prev) => prev,
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
    queryKey: [
      table,
      options?.key || "default",
      id || "query",
      options?.query || "",
    ],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn:
      options?.queryFn ||
      (async () =>
        options?.limit === 0
          ? { total: 0, list: [] }
          : options?.id
          ? await (async () => {
              const tmp = await restApiClient.get(id || "", options!.id!);
              return { total: tmp ? 1 : 0, list: tmp ? [tmp] : [] };
            })()
          : await restApiClient.list(
              id || "",
              options?.query,
              _.omit(options, "query")
            )),
    placeholderData: (prev) => prev,
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

  const restore = useMutation({
    mutationFn: (itemId: string) => restApiClient.restore(id || "", itemId),
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

  return { refresh, items, remove, restore, create, update, upsert };
};

export const useRestSchema = (table: string) => {
  const { id } = useCurrentClient();
  return useQuery<SchemaType>({
    queryKey: [table + "_schema", id],
    queryFn: () => restApiClients[table].schema(id || "") || {},
    placeholderData: (prev) => prev,
  });
};
