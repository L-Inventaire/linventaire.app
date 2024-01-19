import { useRecoilState } from "recoil";
import { ClientInvitationsState, ClientsState } from "./store";
import { useGlobalEffect } from "@features/utils/hooks/use-global-effect";
import { ClientsApiClient } from "../api-client/api-client";
import toast from "react-hot-toast";
import { Clients } from "../types/clients";
import { LoadingState } from "@features/utils/store/loading-state-atom";

export const useClients = () => {
  const [clients, setClients] = useRecoilState(ClientsState);
  const [loading, setLoading] = useRecoilState(LoadingState("useClients"));

  const refresh = async () => {
    setLoading(true);
    const clients = await ClientsApiClient.getMine();
    setClients(clients);
    setLoading(false);
  };

  const inviteUser = async (id: string, email: string) => {
    setLoading(true);
    await ClientsApiClient.updateUser(id, email, []);
    await refresh();
  };

  const create = async (client: Partial<Clients>) => {
    setLoading(true);
    const c = await ClientsApiClient.create(client);
    await refresh();
    return c;
  };

  const update = async (clientId: string, client: Partial<Clients>) => {
    setLoading(true);
    await ClientsApiClient.update(clientId, client);
    await refresh();
  };

  useGlobalEffect(
    "useClients",
    async () => {
      try {
        await refresh();
      } catch (e) {
        toast.error("We couldn't get your clients. Please reload the page.");
      }
    },
    []
  );

  return { loading, clients, inviteUser, create, update, refresh };
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
