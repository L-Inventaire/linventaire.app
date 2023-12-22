import { fetchServer } from "@features/utils/fetch-server";
import { Clients, ClientsUsers } from "../types/clients";

export class ClientsApiClient {
  static getMine = async () => {
    const response = await fetchServer(`/api/clients/v1/clients`);
    if (response.status !== 200) {
      throw new Error("Error getting clients");
    }
    const data = await response.json();
    return data as ClientsUsers[];
  };

  static getInvitations = async () => {
    const response = await fetchServer(`/api/clients/v1/invitations`);
    const data = await response.json();
    return data as ClientsUsers[];
  };

  static acceptInvitation = async (clientId: string, accept = true) => {
    const response = await fetchServer(
      `/api/clients/v1/invitations/${clientId}/${accept ? "accept" : "reject"}`,
      {
        method: "POST",
        body: JSON.stringify({ action: accept }),
      }
    );
    const data = await response.json();
    return data as ClientsUsers;
  };

  static get = async (clientId: string) => {
    const response = await fetchServer(`/api/clients/v1/clients/${clientId}`);
    const data = await response.json();
    return data as Clients;
  };

  static create = async (client: Partial<Clients>) => {
    const response = await fetchServer(`/api/clients/v1/clients`, {
      method: "POST",
      body: JSON.stringify(client),
    });
    const data = await response.json();
    return data as ClientsUsers;
  };

  static update = async (clientId: string, client: Partial<Clients>) => {
    const response = await fetchServer(`/api/clients/v1/clients/${clientId}`, {
      method: "POST",
      body: JSON.stringify(client),
    });
    const data = await response.json();
    return data as ClientsUsers;
  };

  static getUsers = async (clientId: string) => {
    const response = await fetchServer(
      `/api/clients/v1/clients/${clientId}/users`
    );
    const data = await response.json();
    return data as ClientsUsers[];
  };

  static updateUser = async (
    clientId: string,
    userId: string,
    roles: ClientsUsers["roles"]["list"]
  ) => {
    const response = await fetchServer(
      `/api/clients/v1/clients/${clientId}/users/${userId}`,
      {
        method: "POST",
        body: JSON.stringify({ roles }),
      }
    );
    const data = await response.json();
    return data as ClientsUsers;
  };

  static removeUser = async (clientId: string, userId: string) => {
    const response = await fetchServer(
      `/api/clients/v1/clients/${clientId}/users/${userId}`,
      {
        method: "DELETE",
      }
    );
    if (response.status !== 200) {
      throw new Error("Error removing user");
    }
  };
}
