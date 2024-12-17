import { useRecoilState, useRecoilValue } from "recoil";
import { ClientInvitationsState, ClientsState } from "./store";
import { useGlobalEffect } from "@features/utils/hooks/use-global-effect";
import { ClientsApiClient } from "../api-client/api-client";
import toast from "react-hot-toast";
import { Clients, Role } from "../types/clients";
import { LoadingState } from "@features/utils/store/loading-state-atom";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { ROUTES, getRoute } from "@features/routes";
import { useAuth } from "@features/auth/state/use-auth";
import { useHasAccess } from "@features/access";

export const useCurrentClient = () => {
  const { client: clientId } = useParams();
  const clients = useRecoilValue(ClientsState);
  return {
    id: clientId,
    client: clients.find((c) => c.client.id === clientId)?.client,
    clientUser: clients.find((c) => c.client.id === clientId),
  };
};

export const useRedirectToHome = () => {
  const { client: clientId } = useParams();
  const { user } = useAuth();
  const { client, loading, clients } = useClients();
  const hasAccess = useHasAccess();
  const navigate = useNavigate();

  useEffect(() => {
    if (clientId && !client && !loading && !!user) {
      if (hasAccess("ACCOUNTING_READ"))
        navigate(getRoute(ROUTES.Home, { client: clients[0]?.client.id }));
      else if (hasAccess("INVOICES_READ"))
        navigate(getRoute(ROUTES.Invoices, { client: clients[0]?.client.id }));
      else if (hasAccess("ONSITE_SERVICES_READ"))
        navigate(
          getRoute(ROUTES.ServiceItems, { client: clients[0]?.client.id })
        );
      else
        navigate(getRoute(ROUTES.Contacts, { client: clients[0]?.client.id }));
    }
  }, [client?.client_id, loading]);
};

export const useClients = () => {
  const { user } = useAuth();
  const [clients, setClients] = useRecoilState(ClientsState);
  const [loading, setLoading] = useRecoilState(LoadingState("useClients"));
  const { client: clientId } = useParams();
  const client = clients.find((c) => c.client.id === clientId);

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
