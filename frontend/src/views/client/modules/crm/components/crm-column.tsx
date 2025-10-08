import { useEditFromCtrlK } from "@features/ctrlk/use-edit-from-ctrlk";
import { useCRMDefaultModel } from "@features/crm/configuration";
import { CRMItem } from "@features/crm/types/types";
import { formatNumber } from "@features/utils/format/strings";
import { PlusCircleIcon, CheckIcon } from "@heroicons/react/24/outline";
import { IconButton, Badge, ScrollArea } from "@radix-ui/themes";
import _ from "lodash";
import { useDragLayer, useDrop } from "react-dnd";
import { twMerge } from "tailwind-merge";
import { CRMCard } from "./crm-card";
import { useHasAccess } from "@features/access";
import { useAuth } from "@features/auth/state/use-auth";
import { Button } from "../../../../../atoms/button/button";

type CRMColumnProps = {
  title: string;
  items: CRMItem[];
  onMove?: (value: CRMItem) => void;
  type: "new" | "qualified" | "proposal" | "won";
  collapsed?: boolean;
  count?: number;
  onLoadMore?: () => void;
  onLoadPrevious?: () => void;
  canLoadMore?: boolean;
  canLoadPrevious?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

const getColumnColor = (type: "new" | "qualified" | "proposal" | "won") => {
  switch (type) {
    case "new":
      return "bg-blue-500";
    case "qualified":
      return "bg-orange-500";
    case "proposal":
      return "bg-purple-500";
    case "won":
      return "bg-green-500";
    default:
      return "bg-slate-500";
  }
};

const getCollapsedColumnConfig = (
  type: "new" | "qualified" | "proposal" | "won"
) => {
  switch (type) {
    case "new":
      return {
        icon: PlusCircleIcon,
        iconColor: "text-blue-500",
        hoverIconColor: "text-blue-600",
        borderColor: "border-blue-400 bg-blue-50 dark:bg-blue-950",
        title: "Nouveau",
      };
    case "qualified":
      return {
        icon: CheckIcon,
        iconColor: "text-orange-500",
        hoverIconColor: "text-orange-600",
        borderColor: "border-orange-400 bg-orange-50 dark:bg-orange-950",
        title: "Qualifié",
      };
    case "proposal":
      return {
        icon: CheckIcon,
        iconColor: "text-purple-500",
        hoverIconColor: "text-purple-600",
        borderColor: "border-purple-400 bg-purple-50 dark:bg-purple-950",
        title: "Proposition",
      };
    case "won":
      return {
        icon: CheckIcon,
        iconColor: "text-green-500",
        hoverIconColor: "text-green-600",
        borderColor: "border-green-400 bg-green-50 dark:bg-green-950",
        title: "Terminé",
      };
    default:
      return {
        icon: CheckIcon,
        iconColor: "text-slate-500",
        hoverIconColor: "text-slate-600",
        borderColor: "border-slate-400 bg-slate-50 dark:bg-slate-950",
        title: "Colonne",
      };
  }
};

export const CRMColumn = ({
  title,
  items,
  type,
  collapsed = false,
  count,
  onLoadMore,
  onLoadPrevious,
  canLoadMore = false,
  canLoadPrevious = false,
  ...props
}: CRMColumnProps) => {
  const [{ isOver }, dropRef] = useDrop(
    () => ({
      accept: "crm-item",
      drop: (value: CRMItem) => {
        if (props.onMove) props.onMove(value);
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        fromThisColumn: items.map((i) => i.id).includes(monitor.getItem()?.id),
      }),
    }),
    [props.onMove]
  );

  const { isDragging } = useDragLayer((monitor) => ({
    isDragging: monitor.isDragging(),
  }));

  const { user } = useAuth();

  const onEdit = useEditFromCtrlK();
  const getDefaultModel = useCRMDefaultModel;
  const hasAccess = useHasAccess();

  // Si la colonne est réduite (mode collapsible)
  if (collapsed) {
    const config = getCollapsedColumnConfig(type);
    const IconComponent = config.icon;

    return (
      <div
        className={twMerge(
          "flex flex-col w-16 min-w-16 max-w-16 transition-all duration-200 flex-shrink-0",
          props.className
        )}
        ref={dropRef}
        {..._.omit(props, "className")}
      >
        <div
          className={twMerge(
            "p-2 flex-1 bg-slate-25 dark:bg-slate-990 rounded-md flex flex-col items-center justify-center transition-colors border-2",
            isDragging && isOver
              ? config.borderColor
              : "border-slate-200 dark:border-slate-700"
          )}
        >
          <IconComponent
            width="24"
            height="24"
            className={twMerge(
              config.iconColor + " transition-colors",
              isDragging && isOver && config.hoverIconColor
            )}
          />
          <span className="text-xs text-slate-600 dark:text-slate-400 mt-1 text-center font-medium w-full">
            {config.title}
          </span>
          <div className="text-xs text-slate-400 dark:text-slate-500 text-center w-full">
            {count !== undefined && (
              <Badge className="text-center">{formatNumber(count)}</Badge>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={twMerge(
        "flex-1 min-w-80 flex flex-col transition-all duration-200",
        props.className
      )}
      ref={dropRef}
      {..._.omit(props, "className")}
    >
      <div
        className={twMerge(
          "flex-1 rounded-md flex flex-col border-2 transition-all duration-200 p-3",
          isDragging && isOver
            ? twMerge(
                getCollapsedColumnConfig(type).borderColor.replace(
                  "border-dashed ",
                  ""
                ),
                "shadow-lg"
              )
            : "border-transparent bg-slate-25 dark:bg-slate-990"
        )}
      >
        <div className="flex w-full justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={twMerge(
                "w-2 h-2 rounded-full transition-transform duration-200",
                getColumnColor(type)
              )}
            />
            <h2 className={twMerge("block transition-colors duration-200")}>
              {title}
            </h2>
            {count !== undefined && (
              <Badge className="ml-1">{formatNumber(count)}</Badge>
            )}
          </div>
          {hasAccess("CRM_WRITE") && !collapsed && (
            <IconButton
              className="cursor-pointer"
              variant="ghost"
              onClick={() => {
                onEdit("crm_items", "", {
                  ...getDefaultModel(),
                  seller: user?.id,
                  state: type,
                });
              }}
            >
              <PlusCircleIcon width="18" height="18" />
            </IconButton>
          )}
        </div>

        <div className="flex-1 min-h-0 min-w-0 relative">
          <div className="absolute h-full w-full">
            <ScrollArea className="w-full">
              <div className="space-y-2 w-full min-w-0 overflow-hidden">
                {canLoadPrevious && (
                  <div className="flex justify-center">
                    <Button
                      size="sm"
                      className="mx-auto mt-2"
                      theme="outlined"
                      onClick={onLoadPrevious}
                    >
                      Charger les éléments précédents
                    </Button>
                  </div>
                )}
                {items.map((item, index) => (
                  <CRMCard
                    key={item.id}
                    crmItem={item}
                    className={twMerge(index === 0 && "mt-3", "w-full min-w-0")}
                    readonly={!hasAccess("CRM_WRITE")}
                  />
                ))}
                {canLoadMore && (
                  <div className="flex justify-center">
                    <Button
                      size="sm"
                      className="mx-auto mt-2"
                      theme="outlined"
                      onClick={onLoadMore}
                    >
                      Charger les éléments suivants
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
};
