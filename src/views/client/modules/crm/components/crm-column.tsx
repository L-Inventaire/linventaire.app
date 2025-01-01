import { Section } from "@atoms/text";
import { CRMItem } from "@features/crm/types/types";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { IconButton } from "@radix-ui/themes";
import _ from "lodash";
import { useDragLayer, useDrop } from "react-dnd";
import { useSetRecoilState } from "recoil";
import { twMerge } from "tailwind-merge";
import { CRMCard } from "./crm-card";
import { CRMItemModalAtom } from "./crm-items-modal";

type CRMColumnProps = {
  title: string;
  items: CRMItem[];
  onMove?: (value: CRMItem) => void;
  type: "new" | "qualified" | "proposal" | "won";
} & React.HTMLAttributes<HTMLDivElement>;

export const CRMColumn = ({ title, items, type, ...props }: CRMColumnProps) => {
  const [__, dropRef] = useDrop(
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

  useDragLayer((monitor) => ({
    isDragging: monitor.isDragging(),
  }));

  const setCRMModal = useSetRecoilState(CRMItemModalAtom);

  return (
    <div
      className={twMerge("flex flex-col flex-1", props.className)}
      ref={dropRef}
      {..._.omit(props, "className")}
    >
      <div
        className={twMerge(
          "p-3 flex-1 grow bg-slate-25 dark:bg-slate-990 rounded-md flex flex-col justify-between"
        )}
      >
        <div className="flex w-full justify-between items-center">
          <Section className="block mb-2 mt-3">{title}</Section>
          <IconButton
            className="cursor-pointer"
            variant="ghost"
            onClick={() => {
              setCRMModal({
                open: true,
                type,
              });
            }}
          >
            <PlusCircleIcon width="18" height="18" />
          </IconButton>
        </div>

        <div className="flex-1 grow space-y-2">
          {items.map((item, index) => (
            <CRMCard
              key={item.id}
              crmItem={item}
              className={twMerge(index === 0 && "mt-3")}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
