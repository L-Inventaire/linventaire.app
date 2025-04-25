import { RestOptions, useRest } from "@features/utils/rest/hooks/use-rest";
import { Threads } from "../types/types";
import { useEffect } from "react";
import { useCurrentClient } from "@features/clients/state/use-clients";

export const useThreads = (options?: RestOptions<Threads>) => {
  const rest = useRest<Threads>("threads", options);

  useEffect(() => {
    rest.refresh();
  }, [JSON.stringify(options)]);

  return { threads: rest.items, ...rest };
};

export const useThread = (table: string, id: string) => {
  const { client } = useCurrentClient();
  const rest = useThreads({
    query: {
      client_id: client?.id,
      item_entity: table,
      item_id: id,
    },
    limit: id ? 1 : 0,
  });

  return {
    thread: id ? (rest.threads.data?.list || [])[0] : null,
    isPending: id ? rest.threads.isPending : false,
    ...rest,
  };
};
