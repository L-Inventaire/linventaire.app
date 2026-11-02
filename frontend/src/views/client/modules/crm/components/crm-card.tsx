import Avatar from "@atoms/avatar/avatar";
import { Tag } from "@atoms/badge/tag";
import { TagsInput } from "@components/input-rest/tags";
import { getFullName } from "@features/auth/utils";
import { Contacts, getContactName } from "@features/contacts/types/types";
import { CRM_BOARD_STATES, CRMState } from "@features/crm/state/use-crm-board";
import { CRMItem } from "@features/crm/types/types";
import { splitCRMNotes } from "@features/crm/utils/notes";
import { useViewWithCtrlK } from "@features/ctrlk/use-edit-from-ctrlk";
import { ClockIcon, EllipsisHorizontalIcon } from "@heroicons/react/20/solid";
import { Card, DropdownMenu, IconButton } from "@radix-ui/themes";
import _ from "lodash";
import { memo, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useDrag } from "react-dnd";
import { twMerge } from "tailwind-merge";

const DAY = 24 * 60 * 60 * 1000;

/** "3 j", "2 sem.", "4 mois"... since the last change of the item */
const formatAge = (timestamp: number) => {
  const days = Math.floor((Date.now() - timestamp) / DAY);
  if (days < 1) return "Aujourd'hui";
  if (days < 14) return `${days} j`;
  if (days < 60) return `${Math.floor(days / 7)} sem.`;
  if (days < 365) return `${Math.floor(days / 30)} mois`;
  const years = Math.floor(days / 365);
  return `${years} an${years > 1 ? "s" : ""}`;
};

const getAgeColor = (timestamp: number, state: CRMItem["state"]) => {
  if (state === "won" || state === "lost") return "text-slate-400";
  const days = (Date.now() - timestamp) / DAY;
  if (days > 90) return "text-red-500 dark:text-red-400";
  if (days > 30) return "text-orange-500 dark:text-orange-400";
  return "text-slate-400";
};

const UsersAvatars = ({ ids, users }: { ids: string[]; users: any[] }) => {
  const list = _.uniq(ids.filter(Boolean))
    .map((userId) => users.find((u: any) => u.user?.id === userId)?.user)
    .filter(Boolean);

  if (!list.length) return null;
  return (
    <div className="flex -space-x-1">
      {list.map((user: any) => (
        <span
          key={user.id}
          data-tooltip={getFullName(user)}
          className="rounded-full ring-2 ring-white dark:ring-slate-900 inline-flex"
        >
          <Avatar fallback={getFullName(user)} avatar={user.avatar} size={5} />
        </span>
      ))}
    </div>
  );
};

const STATE_DOTS: Record<CRMState, string> = {
  new: "bg-blue-500",
  qualified: "bg-orange-500",
  proposal: "bg-purple-500",
  won: "bg-green-500",
  lost: "bg-slate-500",
};

/** Clicks on the menu (its button, or its items rendered in a portal) must
 * not open the item */
const isMenuClick = (e: React.MouseEvent) =>
  !!(e.target as HTMLElement).closest?.("[data-crm-card-menu], [role=menu]");

/** "Déplacer vers…" menu, the way to change the step on touch screens */
const MoveMenu = ({
  state,
  onMoveTo,
}: {
  state: CRMState;
  onMoveTo: (state: CRMState) => void;
}) => (
  <span className="shrink-0 -my-1 -mr-1" data-crm-card-menu>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <IconButton
          variant="ghost"
          size="1"
          color="gray"
          aria-label="Déplacer vers…"
          className="cursor-pointer [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 data-[state=open]:opacity-100"
        >
          <EllipsisHorizontalIcon className="h-4 w-4" />
        </IconButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end">
        <DropdownMenu.Label>Déplacer vers…</DropdownMenu.Label>
        {CRM_BOARD_STATES.filter((s) => s.key !== state).map((s) => (
          <DropdownMenu.Item key={s.key} onSelect={() => onMoveTo(s.key)}>
            <span
              className={twMerge("w-2 h-2 rounded-full", STATE_DOTS[s.key])}
            />
            {s.label}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </span>
);

type CRMCardProps = {
  readonly?: boolean;
  crmItem: CRMItem;
  /** Contacts loaded by the column, for items without contact summaries */
  contacts?: Contacts[];
  /** Users of the company (clients_users rows), loaded once by the column */
  users: any[];
  /** Can be dragged to another column (not on touch screens) */
  draggable?: boolean;
  /** Moves the item to another step, from the card menu */
  onMoveTo?: (state: CRMState) => void;
} & React.HTMLAttributes<HTMLDivElement>;

export const CRMCard = memo(
  ({
    crmItem,
    readonly,
    contacts,
    users,
    draggable = true,
    onMoveTo,
    ...props
  }: CRMCardProps) => {
    const onView = useViewWithCtrlK();
    const [expanded, setExpanded] = useState(false);
    const [clamped, setClamped] = useState(false);
    const descriptionRef = useRef<HTMLDivElement>(null);

    const [, dragRef] = useDrag(
      () => ({
        canDrag: !readonly && draggable,
        type: "crm-item",
        item: crmItem,
      }),
      [crmItem, readonly, draggable],
    );

    const { title, description } = useMemo(
      () => splitCRMNotes(crmItem.notes),
      [crmItem.notes],
    );

    const contactNames = useMemo(() => {
      const ids = crmItem.contacts ?? [];
      const summaries = crmItem.contact_summaries ?? [];
      return ids
        .map((id, index) => {
          const contact =
            summaries.length === ids.length
              ? summaries[index]
              : contacts?.find((c) => c.id === id);
          return contact ? getContactName(contact) : "";
        })
        .filter(Boolean);
    }, [crmItem.contacts, crmItem.contact_summaries, contacts]);

    useLayoutEffect(() => {
      const el = descriptionRef.current;
      if (el && !expanded) setClamped(el.scrollHeight > el.clientHeight + 1);
    }, [description, expanded]);

    const updatedAt = parseInt(crmItem.updated_at || crmItem.created_at);

    return (
      <Card
        ref={draggable ? (dragRef as any) : undefined}
        className={twMerge(
          "group w-full min-w-0 overflow-hidden cursor-pointer",
          props.className,
        )}
        {..._.omit(props, "className")}
        onClick={(e) => {
          if (isMenuClick(e)) return;
          onView(
            "crm_items",
            crmItem.id,
            undefined,
            readonly ? async () => {} : undefined,
          );
        }}
      >
        <div className="flex items-start gap-2 min-w-0">
          <div className="flex flex-wrap gap-1 grow min-w-0">
            {contactNames.map((name, index) => (
              <Tag key={index} size="xs" className="max-w-full truncate">
                {name}
              </Tag>
            ))}
          </div>
          {!!updatedAt && (
            <span
              className={twMerge(
                "shrink-0 flex items-center gap-0.5 text-xs whitespace-nowrap",
                getAgeColor(updatedAt, crmItem.state),
              )}
              data-tooltip={`Modifié le ${new Date(updatedAt).toLocaleString()}`}
            >
              <ClockIcon className="h-3 w-3" />
              {formatAge(updatedAt)}
            </span>
          )}
          {onMoveTo && <MoveMenu state={crmItem.state} onMoveTo={onMoveTo} />}
        </div>

        <div className="mt-1 text-base font-semibold leading-snug text-slate-900 dark:text-white break-words [overflow-wrap:anywhere]">
          {title || <span className="text-slate-400">Sans titre</span>}
        </div>

        {!!description && (
          <>
            <div
              ref={descriptionRef}
              className={twMerge(
                "mt-1 text-sm leading-snug text-slate-500 dark:text-slate-400 whitespace-pre-line break-words [overflow-wrap:anywhere]",
                !expanded && "line-clamp-3",
              )}
            >
              {description}
            </div>
            {(clamped || expanded) && (
              <button
                type="button"
                className="mt-0.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
              >
                {expanded ? "Réduire" : "Afficher plus"}
              </button>
            )}
          </>
        )}

        <div className="mt-2 flex items-center gap-2 min-w-0">
          <UsersAvatars ids={[crmItem.seller]} users={users} />
          <div className="grow" />
          {!!crmItem.tags?.length && (
            <div className="min-w-0 overflow-hidden flex flex-wrap gap-1 justify-end">
              <TagsInput value={crmItem.tags} disabled size="xs" />
            </div>
          )}
          <UsersAvatars ids={crmItem.assigned ?? []} users={users} />
        </div>
      </Card>
    );
  },
);
