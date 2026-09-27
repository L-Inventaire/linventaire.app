import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  WebhookInput,
  WebhooksApiClient,
} from "../api-client/developers-api-client";

export const useWebhooks = (
  clientId: string,
  options: { all?: boolean } = {},
) => {
  const queryClient = useQueryClient();
  const all = !!options.all;

  const query = useQuery({
    queryKey: ["webhooks", clientId, all],
    queryFn: () => WebhooksApiClient.list(clientId, all),
    enabled: !!clientId,
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["webhooks", clientId] });

  const onError = (e: Error) => toast.error(e.message);

  const create = useMutation({
    mutationFn: (body: WebhookInput) =>
      WebhooksApiClient.create(clientId, body),
    onSuccess: () => refresh(),
    onError,
  });

  const update = useMutation({
    mutationFn: ({ id, ...body }: Partial<WebhookInput> & { id: string }) =>
      WebhooksApiClient.update(clientId, id, body),
    onSuccess: () => refresh(),
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => WebhooksApiClient.remove(clientId, id),
    onSuccess: () => {
      refresh();
      toast.success("Webhook supprimé");
    },
    onError,
  });

  const rotateSecret = useMutation({
    mutationFn: (id: string) => WebhooksApiClient.rotateSecret(clientId, id),
    onError,
  });

  const test = useMutation({
    mutationFn: (id: string) => WebhooksApiClient.test(clientId, id),
    onSuccess: (delivery) => {
      refresh();
      queryClient.invalidateQueries({
        queryKey: ["webhook_deliveries", clientId, delivery.webhook_id],
      });
      if (delivery.status === "success") {
        toast.success(`Test réussi (HTTP ${delivery.response_status})`);
      } else {
        toast.error(`Échec du test : ${delivery.error}`);
      }
    },
    onError,
  });

  return {
    webhooks: query.data ?? [],
    loading: query.isLoading,
    create: create.mutateAsync,
    update: update.mutateAsync,
    remove: remove.mutateAsync,
    rotateSecret: rotateSecret.mutateAsync,
    test: test.mutateAsync,
    saving: create.isPending || update.isPending,
    testing: test.isPending,
    refresh,
  };
};

export const useWebhookDeliveries = (
  clientId: string,
  webhookId: string,
  params: { status?: string; limit: number; offset: number },
) => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["webhook_deliveries", clientId, webhookId, params],
    queryFn: () => WebhooksApiClient.deliveries(clientId, webhookId, params),
    enabled: !!clientId && !!webhookId,
    // Pending deliveries are sent in the background
    refetchInterval: 10000,
  });

  const retry = useMutation({
    mutationFn: (deliveryId: string) =>
      WebhooksApiClient.retry(clientId, webhookId, deliveryId),
    onSuccess: (delivery) => {
      queryClient.invalidateQueries({
        queryKey: ["webhook_deliveries", clientId, webhookId],
      });
      queryClient.invalidateQueries({ queryKey: ["webhooks", clientId] });
      if (delivery.status === "success") toast.success("Livraison réussie");
      else toast.error(`Nouvel échec : ${delivery.error}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    deliveries: query.data?.list ?? [],
    total: query.data?.total ?? 0,
    loading: query.isLoading,
    retry: retry.mutateAsync,
    retrying: retry.isPending,
  };
};

export const useWebhookDelivery = (
  clientId: string,
  webhookId: string,
  deliveryId: string | null,
) =>
  useQuery({
    queryKey: ["webhook_delivery", clientId, webhookId, deliveryId],
    queryFn: () =>
      WebhooksApiClient.delivery(clientId, webhookId, deliveryId as string),
    enabled: !!deliveryId,
  });
