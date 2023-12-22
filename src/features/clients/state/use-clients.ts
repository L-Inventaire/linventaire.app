import { useRecoilState } from "recoil";
import { ClientInvitationsState, ClientsState } from "./store";
import { useGlobalEffect } from "@features/utils/hooks/use-global-effect";
import { ClientsApiClient } from "../api-client/api-client";
import toast from "react-hot-toast";
import { Clients } from "../types/clients";

export const useClients = () => {
  const [clients, setClients] = useRecoilState(ClientsState);

  const refresh = async () => {
    const clients = await ClientsApiClient.getMine();
    setClients(clients);
  };

  const create = async (client: Partial<Clients>) => {
    await ClientsApiClient.create(client);
    await refresh();
  };

  const update = async (clientId: string, client: Partial<Clients>) => {
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

  return { clients, create, update, refresh };
};

export const useClientInvitations = () => {
  const [invitations, setInvitations] = useRecoilState(ClientInvitationsState);

  const refresh = async () => {
    const invitations = await ClientsApiClient.getInvitations();
    setInvitations(invitations);
  };

  const accept = async (clientId: string, accept = true) => {
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

  return { invitations, accept, refresh };
};
