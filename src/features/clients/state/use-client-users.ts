import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ClientsApiClient } from "../api-client/api-client";
import { ClientsUsers } from "../types/clients";

export const useClientUsers = (id: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["clients_users", id],
    queryFn: () => ClientsApiClient.getUsers(id),
  });

  const users = query.data ?? [];
  const loading = query.isLoading;

  const refresh = async () => {
    queryClient.invalidateQueries({ queryKey: ["clients_users", id] });
  };

  const add = useMutation({
    mutationFn: (email: string) => ClientsApiClient.updateUser(id, email, []),
    onSuccess: () => refresh(),
  });

  const remove = useMutation({
    mutationFn: (email: string) => ClientsApiClient.removeUser(id, email),
    onSuccess: () => {
      refresh();
      toast.success("Utilisateur supprimé");
    },
    onError: () =>
      toast.error("Erreur lors de la suppression de l'utilisateur"),
  });

  const update = useMutation({
    mutationFn: ({
      id: userId,
      roles,
    }: {
      id: string;
      roles: ClientsUsers["roles"]["list"];
    }) => ClientsApiClient.updateUser(id, userId, roles),
    onSuccess: () => refresh(),
  });

  return {
    loading,
    users: users.filter((u) => u.active),
    allUsers: users,
    add: add.mutate,
    remove: remove.mutate,
    update: update.mutate,
    refresh,
  };
};
