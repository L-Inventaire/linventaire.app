import { useRecoilState } from "recoil";
import { ClientsApiClient } from "../api-client/api-client";
import { ClientUsersState } from "./store";
import { ClientsUsers } from "../types/clients";

export const useClientUsers = (id: string) => {
  const [users, setUsers] = useRecoilState(ClientUsersState(id));

  const refresh = async () => {
    const users = await ClientsApiClient.getUsers(id);
    setUsers(users);
  };

  const add = async (email: string) => {
    await ClientsApiClient.updateUser(id, email, []);
    await refresh();
  };

  const remove = async (email: string) => {
    await ClientsApiClient.removeUser(id, email);
    await refresh();
  };

  const update = async (
    userId: string,
    roles: ClientsUsers["roles"]["list"]
  ) => {
    await ClientsApiClient.updateUser(id, userId, roles);
    await refresh();
  };

  return { users, add, remove, update, refresh };
};
