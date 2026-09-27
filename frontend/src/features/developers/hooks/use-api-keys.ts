import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ApiKeysApiClient } from "../api-client/api-keys-api-client";

export const useApiKeys = (
  clientId: string,
  options: { all?: boolean } = {},
) => {
  const queryClient = useQueryClient();
  const all = !!options.all;

  const query = useQuery({
    queryKey: ["api_keys", clientId, all],
    queryFn: () => ApiKeysApiClient.list(clientId, all),
    enabled: !!clientId,
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["api_keys", clientId] });

  const create = useMutation({
    mutationFn: (body: { name: string; expires_at: number | null }) =>
      ApiKeysApiClient.create(clientId, body),
    onSuccess: () => refresh(),
    onError: (e: Error) =>
      toast.error("Impossible de créer la clé API : " + e.message),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => ApiKeysApiClient.revoke(clientId, id),
    onSuccess: () => {
      refresh();
      toast.success("Clé API révoquée");
    },
    onError: () => toast.error("Impossible de révoquer la clé API"),
  });

  return {
    keys: query.data ?? [],
    loading: query.isLoading,
    create: create.mutateAsync,
    creating: create.isPending,
    revoke: revoke.mutateAsync,
    revoking: revoke.isPending,
    refresh,
  };
};
