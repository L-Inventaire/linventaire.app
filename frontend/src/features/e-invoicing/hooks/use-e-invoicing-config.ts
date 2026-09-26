import { useCurrentClient } from "@features/clients/state/use-clients";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EInvoicingApiClient } from "../api-client/e-invoicing-api-client";
import { UpdateSettingsRequest } from "../types/types";
import toast from "react-hot-toast";

export const useEInvoicingConfig = () => {
  const { client } = useCurrentClient();
  const queryClient = useQueryClient();

  const config = useQuery({
    queryKey: ["e-invoicing-config", client?.id],
    queryFn: () => EInvoicingApiClient.getConfig(client!.id),
    enabled: !!client?.id,
  });

  const authorize = useMutation({
    mutationFn: () => EInvoicingApiClient.authorize(client!.id),
    onSuccess: (data) => {
      if (data.url) {
        // SuperPDP hosted onboarding, it redirects back to the settings page
        window.location.href = data.url;
      } else {
        toast.error("Impossible de démarrer la connexion à SuperPDP");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la connexion à SuperPDP");
    },
  });

  const testConnection = useMutation({
    mutationFn: () => EInvoicingApiClient.testConnection(client!.id),
    onSuccess: (data) => {
      if (data.success && data.status === "pending_verification") {
        toast("Vérification de l'entreprise en cours chez SuperPDP");
        queryClient.invalidateQueries({
          queryKey: ["e-invoicing-config", client?.id],
        });
      } else if (data.success) {
        toast.success("Connexion réussie !");
        queryClient.invalidateQueries({
          queryKey: ["e-invoicing-config", client?.id],
        });
      } else {
        toast.error(data.error || "Erreur de connexion");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors du test de connexion");
    },
  });

  const deleteConfig = useMutation({
    mutationFn: () => EInvoicingApiClient.deleteConfig(client!.id),
    onSuccess: () => {
      toast.success("Configuration supprimée");
      queryClient.invalidateQueries({
        queryKey: ["e-invoicing-config", client?.id],
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la suppression");
    },
  });

  const updateSettings = useMutation({
    mutationFn: (data: UpdateSettingsRequest) =>
      EInvoicingApiClient.updateSettings(client!.id, data),
    onSuccess: () => {
      toast.success("Paramètres mis à jour");
      queryClient.invalidateQueries({
        queryKey: ["e-invoicing-config", client?.id],
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la mise à jour");
    },
  });

  const syncData = useMutation({
    mutationFn: () => EInvoicingApiClient.syncData(client!.id),
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Données synchronisées");
        queryClient.invalidateQueries({
          queryKey: ["e-invoicing-config", client?.id],
        });
      } else {
        toast.error("Erreur lors de la synchronisation");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la synchronisation");
    },
  });

  return {
    config: config.data?.config || null,
    isLoading: config.isLoading,
    authorize,
    testConnection,
    deleteConfig,
    updateSettings,
    syncData,
    refetch: config.refetch,
  };
};
