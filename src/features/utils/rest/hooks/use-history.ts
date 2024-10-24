import { useCurrentClient } from "@features/clients/state/use-clients";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import _ from "lodash";
import { RestApiClient } from "../api-client/rest-api-client";

const restApiClients: { [key: string]: RestApiClient<any> } = {};
const pageSize = 50;

export const useRefreshRestHistory = <T>() => {
  const queryClient = useQueryClient();

  const refresh = async (clientId: string, table: string, id: string) => {
    restApiClients[table] = restApiClients[table] || new RestApiClient(table);
    const restApiClient = restApiClients[table] as RestApiClient<T>;

    let currentData = queryClient.getQueryData<{
      pages: { list: T[] }[];
      pageParams: number[];
    }>(["history", table, id]);
    const firstPage = await restApiClient.history(clientId!, id, 5, 0);
    currentData = currentData || { pages: [], pageParams: [0] };
    currentData!.pages = currentData.pages || [];
    currentData!.pages[0] = currentData!.pages[0] || {
      list: [],
      has_more: firstPage.has_more,
    };
    currentData!.pages[0]!.list = _.uniqBy(
      [...firstPage.list, ...(currentData!.pages[0].list || [])],
      (a: any) => JSON.stringify(a)
    );
    queryClient.setQueryData(["history", table, id], currentData);
  };

  return refresh;
};

export const useRestHistory = <T>(table: string, id: string) => {
  const { id: clientId } = useCurrentClient();
  const refresh = useRefreshRestHistory<T>();

  restApiClients[table] = restApiClients[table] || new RestApiClient(table);
  const restApiClient = restApiClients[table] as RestApiClient<T>;

  const history = useInfiniteQuery<{ list: T[]; has_more?: boolean }>({
    initialPageParam: 0,
    queryKey: ["history", table, id],
    queryFn: async ({ pageParam = 0 }) => {
      const data = await restApiClient.history(
        clientId!,
        id,
        pageSize,
        pageParam as number
      );
      return data;
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage?.has_more ? allPages.length * pageSize : undefined,
  });

  return {
    ...history,
    refresh: () => refresh(clientId!, table, id),
  };
};
