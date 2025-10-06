import { useAuth } from "@features/auth/state/use-auth";
import { useGlobalEffect } from "@features/utils/hooks/use-global-effect";
import { LoadingState } from "@features/utils/store/loading-state-atom";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import { useRecoilState, useRecoilValue } from "recoil";
import { ClientsApiClient } from "../api-client/api-client";
import { Clients, Role } from "../types/clients";
import { ClientInvitationsState, ClientsState } from "./store";

export const useCurrentClient = () => {
  const { client: clientId } = useParams();
  const clients = useRecoilValue(ClientsState);
  return {
    id: clientId,
    client: clients.find((c) => c.client.id === clientId)?.client,
    clientUser: clients.find((c) => c.client.id === clientId),
  };
};

export const useClients = () => {
  const { user } = useAuth();
  const [clients, setClients] = useRecoilState(ClientsState);
  const [loading, setLoading] = useRecoilState(LoadingState("useClients"));
  const { client: clientId } = useParams();
  const client = clients.find((c) => c.client.id === clientId);

  useEffect(() => {
    // URL client not found in clients list, redirect to root
    if (clients.length && !clients.find((c) => c.client.id === clientId)) {
      document.location = "/";
    }
  }, [clients.length]);

  const refresh = async () => {
    setLoading(true);
    const clients = await ClientsApiClient.getMine();
    setClients(clients);
    setLoading(false);
  };

  const inviteUsers = async (
    id: string,
    emails: string[],
    roles: Role[] = []
  ) => {
    setLoading(true);
    for (const email of emails) {
      await ClientsApiClient.updateUser(id, email, roles);
    }
    await refresh();
  };

  const get = async (clientId: string) => {
    setLoading(true);
    const client = await ClientsApiClient.get(clientId);
    await refresh();
    return client;
  };

  const create = async (client: Partial<Clients>) => {
    setLoading(true);
    client.preferences = {
      ...(client.preferences || {}),
      timezone:
        client.preferences?.timezone ||
        Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    const c = await ClientsApiClient.create(client);
    await refresh();
    return c;
  };

  const update = async (clientId: string, client: Partial<Clients>) => {
    setLoading(true);
    try {
      await ClientsApiClient.update(clientId, client);
      await refresh();
      toast.success("Your company has been updated.");
    } catch (e) {
      toast.error("We couldn't update your company. Please try again.");
    }
  };

  useGlobalEffect(
    "useClients",
    async () => {
      try {
        if (user) await refresh();
      } catch (e) {
        toast.error("We couldn't get your clients. Please reload the page.");
      }
    },
    [!!user]
  );

  return {
    loading,
    clients,
    inviteUsers,
    get,
    create,
    update,
    refresh,
    client,
  };
};

export const useClientInvitations = () => {
  const [invitations, setInvitations] = useRecoilState(ClientInvitationsState);
  const [loading, setLoading] = useRecoilState(
    LoadingState("useClientInvitations")
  );

  const refresh = async () => {
    setLoading(true);
    const invitations = await ClientsApiClient.getInvitations();
    setInvitations(invitations);
    setLoading(false);
  };

  const accept = async (clientId: string, accept = true) => {
    setLoading(true);
    await ClientsApiClient.acceptInvitation(clientId, accept);
    await refresh();
  };

  useGlobalEffect(
    "useClientInvitations",
    async () => {
      try {
        await refresh();
      } catch (e) {
        toast.error("We couldn't get your invitations.");
      }
    },
    []
  );

  return { loading, invitations, accept, refresh };
};
