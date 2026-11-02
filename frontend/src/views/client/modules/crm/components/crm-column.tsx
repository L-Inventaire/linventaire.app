import { useHasAccess } from "@features/access";
import { useAuth } from "@features/auth/state/use-auth";
import { useCRMDefaultModel } from "@features/crm/configuration";
import { CRMState } from "@features/crm/state/use-crm-board";
import { CRMItem } from "@features/crm/types/types";
import { useEditFromCtrlK } from "@features/ctrlk/use-edit-from-ctrlk";
import { formatNumber } from "@features/utils/format/strings";
import { RestSearchQuery } from "@features/utils/rest/hooks/use-rest";
import { CheckIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import { Badge, IconButton } from "@radix-ui/themes";
import { useDragLayer, useDrop } from "react-dnd";
import { twMerge } from "tailwind-merge";
import { CRMItemsList } from "./crm-items-list";

export const CRM_COLUMN_STYLES: Record<
  CRMState,
  { dot: string; icon: typeof CheckIcon; iconColor: string; over: string }
> = {
  new: {
    dot: "bg-blue-500",
    icon: PlusCircleIcon,
    iconColor: "text-blue-500",
    over: "border-blue-400 bg-blue-50 dark:bg-blue-950",
  },
  qualified: {
    dot: "bg-orange-500",
    icon: CheckIcon,
    iconColor: "text-orange-500",
    over: "border-orange-400 bg-orange-50 dark:bg-orange-950",
  },
  proposal: {
    dot: "bg-purple-500",
    icon: CheckIcon,
    iconColor: "text-purple-500",
    over: "border-purple-400 bg-purple-50 dark:bg-purple-950",
  },
  won: {
    dot: "bg-green-500",
    icon: CheckIcon,
    iconColor: "text-green-500",
    over: "border-green-400 bg-green-50 dark:bg-green-950",
  },
  lost: {
    dot: "bg-slate-500",
    icon: CheckIcon,
    iconColor: "text-slate-500",
    over: "border-slate-400 bg-slate-50 dark:bg-slate-950",
  },
};

/** Opens the creation of an opportunity in the given step */
export const useCreateCRMItem = () => {
  const { user } = useAuth();
  const onEdit = useEditFromCtrlK();
  const getDefaultModel = useCRMDefaultModel;
  return (state: CRMState) =>
    onEdit("crm_items", "", {
      ...getDefaultModel(),
      seller: user?.id,
      state,
    });
};

type CRMColumnProps = {
  title: string;
  type: CRMState;
  query: RestSearchQuery[];
  count?: number;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onMove?: (item: CRMItem, state: CRMState) => void;
};

export const CRMColumn = ({
  title,
  type,
  query,
  count,
  collapsed = false,
  onToggleCollapsed,
  onMove,
}: CRMColumnProps) => {
  const hasAccess = useHasAccess();
  const create = useCreateCRMItem();
  const style = CRM_COLUMN_STYLES[type];

  const [{ isOver }, dropRef] = useDrop(
    () => ({
      accept: "crm-item",
      drop: (item: CRMItem) => {
        if (item.state !== type) onMove?.(item, type);
      },
      collect: (monitor) => ({ isOver: !!monitor.isOver() }),
    }),
    [onMove, type],
  );

  const { isDragging } = useDragLayer((monitor) => ({
    isDragging: monitor.isDragging(),
  }));
  const highlighted = isDragging && isOver;

  if (collapsed) {
    const Icon = style.icon;
    return (
      <div
        ref={dropRef}
        role="button"
        data-tooltip={`Afficher la colonne ${title}`}
        onClick={onToggleCollapsed}
        className={twMerge(
          "w-16 shrink-0 p-2 rounded-md flex flex-col items-center justify-center border-2 cursor-pointer transition-colors",
          "bg-slate-25 dark:bg-slate-990 hover:bg-slate-50 dark:hover:bg-slate-900",
          highlighted ? style.over : "border-slate-200 dark:border-slate-700",
        )}
      >
        <Icon width="24" height="24" className={style.iconColor} />
        <span className="text-xs text-slate-600 dark:text-slate-400 mt-1 text-center font-medium w-full">
          {title}
        </span>
        {count !== undefined && <Badge>{formatNumber(count)}</Badge>}
      </div>
    );
  }

  return (
    <div
      ref={dropRef}
      className={twMerge(
        "flex-1 min-w-72 basis-0 min-h-0 flex flex-col rounded-md border-2 transition-colors",
        highlighted
          ? twMerge(style.over, "shadow-lg")
          : "border-transparent bg-slate-25 dark:bg-slate-990",
      )}
    >
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 shrink-0">
        <div className={twMerge("w-2 h-2 rounded-full", style.dot)} />
        <h2 className="font-medium">{title}</h2>
        {count !== undefined && <Badge>{formatNumber(count)}</Badge>}
        <div className="grow" />
        {onToggleCollapsed && (
          <button
            type="button"
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            onClick={onToggleCollapsed}
          >
            Réduire
          </button>
        )}
        {hasAccess("CRM_WRITE") && (
          <IconButton
            className="cursor-pointer"
            variant="ghost"
            data-tooltip="Nouvelle opportunité"
            onClick={() => create(type)}
          >
            <PlusCircleIcon width="18" height="18" />
          </IconButton>
        )}
      </div>

      <CRMItemsList
        type={type}
        query={query}
        onMove={onMove}
        className="flex-1 min-h-0 px-3 pb-3"
      />
    </div>
  );
};
