import { useCurrentClient } from "@features/clients/state/use-clients";
import { LoadingState } from "@features/utils/store/loading-state-atom";
import { Pagination } from "@molecules/table/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import _, { isArray } from "lodash";
import { useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import { useDebounceValue } from "usehooks-ts";
import { RestApiClient } from "../api-client/rest-api-client";
import { SchemaType } from "../types/types";

export const restApiClients: { [key: string]: RestApiClient<any> } = {};

export const getRestApiClient = (table: string) => {
  return restApiClients[table] || new RestApiClient(table);
};

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
  deleted?: boolean;
  ignoreEmptyFilters?: boolean;
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

export const useRestMainOptions = <T>(table: string) => {
  const query = useQuery({
    queryKey: ["navbar", table],
  });
  const queryClient = useQueryClient();
  return {
    options: query.data as RestOptions<T>,
    setOptions: (options: RestOptions<T>) =>
      queryClient.setQueryData(["navbar", table], options),
  };
};

export const useRest = <T>(table: string, options?: RestOptions<T>) => {
  restApiClients[table] = restApiClients[table] || new RestApiClient(table);
  const restApiClient = restApiClients[table] as RestApiClient<T>;
  const { id } = useCurrentClient();
  const queryClient = useQueryClient();

  // If main list, we'll save the query to a global storage for the document bar nav (prev / next buttons)
  if (options?.key?.indexOf("main") === 0) {
    queryClient.setQueryData(["navbar", table], options);
  }

  // Auto replace complex queries by a id getter when possible
  if (
    options?.query &&
    !options?.id &&
    (options?.query as any)?.length === 1 &&
    (options?.query as any)?.[0].values?.length === 1 &&
    (options?.query as any)?.[0].key === "id"
  ) {
    options.id = (options?.query as any)?.[0].values[0].value;
    options.query = undefined;
  }

  if (
    options?.query &&
    _.isArray(options?.query) &&
    options?.query?.find((a) => a.key === "is_deleted")?.values[0].value ===
      true
  ) {
    options.deleted = true;
  }

  const queryKey = [
    table,
    id || "client",
    options?.id || "list",
    options?.key || "default",
    options?.id || options?.query || "",
    options?.index || "",
    options?.offset || 0,
    options?.limit || 20,
  ];

  const [isPendingModification, setIsPendingModification] = useRecoilState(
    LoadingState("loading-modification-" + table)
  );

  const items = useQuery({
    queryKey,
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn:
      options?.queryFn ||
      (async () => {
        const invalidRequest =
          options?.limit === 0 ||
          (options?.ignoreEmptyFilters !== false &&
            isArray(options?.query) &&
            (options?.query as any[])?.find((a) => a.values.length === 0));

        const temp = invalidRequest
          ? { total: 0, list: [] }
          : options?.id !== undefined
          ? await (async () => {
              const tmp = await restApiClient.get(id || "", options!.id!);
              return { total: tmp ? 1 : 0, list: tmp ? [tmp] : [] };
            })()
          : await restApiClient.list(
              id || "",
              options?.query,
              _.omit(options, "query")
            );
        setIsPendingModification(false);

        return temp;
      }),
    placeholderData: (prev) => prev,
  });

  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: [table, id, ...(options?.key ? [options?.key] : [])],
    });

  const remove = useMutation({
    mutationFn: (itemId: string) => restApiClient.delete(id || "", itemId),
    onMutate: () => setIsPendingModification(true),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [table, id],
      });
    },
  });

  const restore = useMutation({
    mutationFn: (itemId: string) => restApiClient.restore(id || "", itemId),
    onMutate: () => setIsPendingModification(true),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [table, id],
      });
    },
  });

  const create = useMutation({
    mutationFn: (item: Partial<T>) => restApiClient.create(id || "", item),
    onMutate: () => setIsPendingModification(true),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [table, id],
      });
    },
  });

  const update = useMutation({
    mutationFn: (item: Partial<T>, itemId?: string) =>
      restApiClient.update(id || "", item, (item as any)?.id || itemId),
    onMutate: () => setIsPendingModification(true),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [table, id],
      });
    },
  });

  const upsert = useMutation({
    mutationFn: (item: Partial<T>, itemId?: string) =>
      (item as any)?.id || itemId
        ? restApiClient.update(id || "", item, (item as any)?.id || itemId)
        : restApiClient.create(id || "", item),
    onMutate: () => setIsPendingModification(true),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [table, id],
      });
    },
  });

  return {
    refresh,
    items,
    remove,
    restore,
    create,
    update,
    upsert,
    isPendingModification,
  };
};

export const useRestSchema = (table: string) => {
  const { id } = useCurrentClient();
  return useQuery<SchemaType>({
    queryKey: [table + "_schema", id],
    queryFn: () => restApiClients[table].schema(id || "") || {},
    placeholderData: (prev) => prev,
  });
};

export const useRestExporter = <T>(table: string) => {
  const { client } = useCurrentClient();
  return (options: RestOptions<T>) =>
    async (pagination: Pick<Pagination, "page" | "perPage">) => {
      return (
        await getRestApiClient(table).list(client?.id || "", options.query, {
          deleted: options.deleted,
          index: options.index,
          asc: options.asc,
          limit: pagination.perPage,
          offset: (pagination.page - 1) * pagination.perPage,
        })
      ).list;
    };
};
