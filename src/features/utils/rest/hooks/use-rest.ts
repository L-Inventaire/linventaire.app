import { useCurrentClient } from "@features/clients/state/use-clients";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RestApiClient } from "../api-client/rest-api-client";

const restApiClients: { [key: string]: RestApiClient<any> } = {};

export const useRest = <T>(table: string) => {
  restApiClients[table] = restApiClients[table] || new RestApiClient(table);
  const restApiClient = restApiClients[table];
  const { id } = useCurrentClient();
  const queryClient = useQueryClient();

  const items = useQuery({
    queryKey: [table, id],
    queryFn: () => restApiClient.list(id || ""),
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
