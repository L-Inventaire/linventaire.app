import { buildQueryFromMap } from "@components/search-bar/utils/utils";
import { useHasAccess } from "@features/access";
import { useClientUsers } from "@features/clients/state/use-client-users";
import { useCurrentClient } from "@features/clients/state/use-clients";
import { useContacts } from "@features/contacts/hooks/use-contacts";
import { CRMState, useCRMBoardColumn } from "@features/crm/state/use-crm-board";
import { CRMItem } from "@features/crm/types/types";
import { RestSearchQuery } from "@features/utils/rest/hooks/use-rest";
import _ from "lodash";
import { useEffect, useMemo, useRef } from "react";
import { twMerge } from "tailwind-merge";
import { CRMCard } from "./crm-card";

/** Contacts of the items whose contact summaries are not computed yet */
const useMissingContacts = (items: CRMItem[]) => {
  const ids = useMemo(
    () =>
      _.uniq(
        items
          .filter(
            (i) =>
              (i.contacts?.length || 0) !== (i.contact_summaries?.length || 0),
          )
          .flatMap((i) => i.contacts || []),
      ).sort(),
    [items],
  );
  const { items: contacts } = useContacts({
    key: "crm-board-contacts",
    query: buildQueryFromMap({ id: ids }),
    limit: ids.length,
  });
  return contacts?.data?.list || [];
};

/**
 * Scrollable list of the CRM items of one step, loaded page by page while
 * scrolling. Used by the columns of the board and by the mobile view.
 */
export const CRMItemsList = ({
  type,
  query,
  enabled = true,
  draggable = true,
  onMove,
  className,
}: {
  type: CRMState;
  query: RestSearchQuery[];
  enabled?: boolean;
  /** Cards can be dragged to another column (not on touch screens) */
  draggable?: boolean;
  onMove?: (item: CRMItem, state: CRMState) => void;
  className?: string;
}) => {
  const hasAccess = useHasAccess();
  const readonly = !hasAccess("CRM_WRITE");
  const { id: clientId } = useCurrentClient();
  const { users } = useClientUsers(clientId || "");

  const { list, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } =
    useCRMBoardColumn(type, query, enabled);
  const contacts = useMissingContacts(list);

  // Load the next page when the bottom of the list becomes visible
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { root: scrollRef.current, rootMargin: "400px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div
      ref={scrollRef}
      className={twMerge("overflow-y-auto overflow-x-hidden", className)}
    >
      <div className="space-y-2 min-w-0">
        {list.map((item) => (
          <CRMCard
            key={item.id}
            crmItem={item}
            contacts={contacts}
            users={users}
            readonly={readonly}
            draggable={draggable}
            onMoveTo={
              readonly || !onMove ? undefined : (state) => onMove(item, state)
            }
          />
        ))}
        {!isPending && !list.length && (
          <div className="text-center text-sm text-slate-400 py-6">
            Aucun élément
          </div>
        )}
        <div ref={sentinelRef} />
        {(isPending || isFetchingNextPage) && (
          <div className="text-center text-sm text-slate-400 py-2">
            Chargement…
          </div>
        )}
      </div>
    </div>
  );
};
