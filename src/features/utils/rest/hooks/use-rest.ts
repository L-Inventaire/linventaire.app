import { useCurrentClient } from "@features/clients/state/use-clients";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RestApiClient } from "../api-client/rest-api-client";
import _ from "lodash";

const restApiClients: { [key: string]: RestApiClient<any> } = {};

export type RestOptions<T> = {
  query?: Partial<T> | any;
  limit?: number;
  offset?: number;
  asc?: boolean;
};

export const useRest = <T>(table: string, options?: RestOptions<T>) => {
  restApiClients[table] = restApiClients[table] || new RestApiClient(table);
  const restApiClient = restApiClients[table] as RestApiClient<T>;
  const { id } = useCurrentClient();
  const queryClient = useQueryClient();

  const items = useQuery({
    queryKey: [
      table,
      id,
      options?.offset,
      options?.limit,
      options?.asc,
      options?.query,
    ],
    queryFn: () =>
      restApiClient.list(id || "", options?.query, _.omit(options, "query")),
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

  return { items, remove, create, update, upsert };
};
