import { useClients } from "./clients/state/use-clients";
import { Role } from "./clients/types/clients";

export const useHasAccess = () => {
  const { client } = useClients();
  return (requested: Role) => {
    if (!client) return false;
    if (client.roles?.list?.includes("CLIENT_MANAGE")) return true;
    return (
      client.roles?.list?.includes(requested) ||
      client.roles?.list?.includes(
        requested.replace("_READ", "_MANAGE") as any
      ) ||
      client.roles?.list?.includes(
        requested.replace("_READ", "_WRITE") as any
      ) ||
      client.roles?.list?.includes(
        requested.replace("_WRITE", "_MANAGE") as any
      )
    );
  };
};
