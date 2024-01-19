import { useRecoilState } from "recoil";
import { ClientsApiClient } from "../api-client/api-client";
import { ClientUsersState } from "./store";
import { ClientsUsers } from "../types/clients";
import { LoadingState } from "@features/utils/store/loading-state-atom";

export const useClientUsers = (id: string) => {
  const [users, setUsers] = useRecoilState(ClientUsersState(id));
  const [loading, setLoading] = useRecoilState(
    LoadingState(`useClientUsers-${id}`)
  );

  const refresh = async () => {
    setLoading(true);
    const users = await ClientsApiClient.getUsers(id);
    setUsers(users);
    setLoading(false);
  };

  const add = async (email: string) => {
    setLoading(true);
    await ClientsApiClient.updateUser(id, email, []);
    await refresh();
  };

  const remove = async (email: string) => {
    setLoading(true);
    await ClientsApiClient.removeUser(id, email);
    await refresh();
  };

  const update = async (
    userId: string,
    roles: ClientsUsers["roles"]["list"]
  ) => {
    setLoading(true);
    await ClientsApiClient.updateUser(id, userId, roles);
    await refresh();
  };

  return { loading, users, add, remove, update, refresh };
};
