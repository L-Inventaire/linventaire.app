import { useCurrentClient } from "@features/clients/state/use-clients";
import {
  getRestApiClient,
  RestSearchQuery,
} from "@features/utils/rest/hooks/use-rest";
import {
  InfiniteData,
  QueryKey,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import { CRMItem } from "../types/types";

export type CRMState = CRMItem["state"];

export const CRM_BOARD_PAGE_SIZE = 30;

/** Steps of the pipeline, in order */
export const CRM_BOARD_STATES: { key: CRMState; label: string }[] = [
  { key: "new", label: "Nouveau" },
  { key: "qualified", label: "Qualifié" },
  { key: "proposal", label: "Proposition" },
  { key: "won", label: "Terminé" },
];

type Page = { total: number; list: CRMItem[] };

// Keys start with ["crm_items", client] so that any change made to a CRM item
// elsewhere (edition, creation, deletion) also refreshes the board
const boardKey = (clientId: string) => ["crm_items", clientId, "crm-board"];

const stateQuery = (query: RestSearchQuery[], state: CRMState) => [
  ...query.filter((q) => q.key !== "state"),
  { key: "state", values: [{ value: state, op: "equals" }] },
];

/**
 * Items of one column of the CRM board, loaded page by page while scrolling.
 */
export const useCRMBoardColumn = (
  state: CRMState,
  query: RestSearchQuery[],
  enabled: boolean,
) => {
  const { id: clientId } = useCurrentClient();

  const items = useInfiniteQuery<
    Page,
    Error,
    InfiniteData<Page>,
    QueryKey,
    number
  >({
    queryKey: [...boardKey(clientId || ""), state, query],
    enabled: enabled && !!clientId,
    staleTime: 1000 * 60 * 5,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getRestApiClient("crm_items").list(
        clientId || "",
        stateQuery(query, state),
        {
          index: "updated_at",
          asc: false,
          limit: CRM_BOARD_PAGE_SIZE,
          offset: pageParam,
        },
      ) as Promise<Page>,
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((acc, p) => acc + p.list.length, 0);
      return last.list.length && loaded < last.total ? loaded : undefined;
    },
    placeholderData: (prev) => prev,
  });

  return {
    ...items,
    list: items.data?.pages.flatMap((p) => p.list) || [],
  };
};

/**
 * Moves a CRM item to another column. The board is updated right away and
 * rolled back if the server refuses the change.
 */
export const useCRMBoardMove = () => {
  const { id: clientId } = useCurrentClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ item, state }: { item: CRMItem; state: CRMState }) =>
      getRestApiClient("crm_items").update(clientId || "", {
        id: item.id,
        state,
      } as Partial<CRMItem>),
    onMutate: async ({ item, state }) => {
      const key = boardKey(clientId || "");
      await queryClient.cancelQueries({ queryKey: key });
      const snapshot = queryClient.getQueriesData<InfiniteData<Page>>({
        queryKey: key,
      });

      const moved = { ...item, state, updated_at: `${Date.now()}` };
      for (const [queryKey, data] of snapshot) {
        if (!data) continue;
        const columnState = queryKey[3] as CRMState;
        const had = data.pages.some((p) =>
          p.list.some((i) => i.id === item.id),
        );
        const pages = data.pages.map((page, index) => {
          let list = page.list.filter((i) => i.id !== item.id);
          let total = page.total - (had ? 1 : 0);
          if (columnState === state) {
            total = page.total + 1;
            if (index === 0) list = [moved, ...list];
          }
          return { total, list };
        });
        queryClient.setQueryData(queryKey, { ...data, pages });
      }

      // Counters shown in the column headers
      const counts = queryClient.getQueriesData<number>({
        queryKey: ["crm_items", clientId, "count"],
      });
      for (const [queryKey, count] of counts) {
        if (typeof count !== "number") continue;
        if (queryKey[3] === `crm-count-${item.state}`)
          queryClient.setQueryData(queryKey, Math.max(0, count - 1));
        if (queryKey[3] === `crm-count-${state}`)
          queryClient.setQueryData(queryKey, count + 1);
      }

      return { snapshot, counts };
    },
    onError: (_err, _vars, context) => {
      for (const [queryKey, data] of context?.snapshot || [])
        queryClient.setQueryData(queryKey, data);
      for (const [queryKey, data] of context?.counts || [])
        queryClient.setQueryData(queryKey, data);
      toast.error("Impossible de déplacer cet élément.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["crm_items", clientId] });
    },
  });
};
