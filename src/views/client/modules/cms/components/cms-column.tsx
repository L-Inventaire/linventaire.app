import { Section } from "@atoms/text";
import { useClients } from "@features/clients/state/use-clients";
import { useCMSItems } from "@features/cms/state/use-cms";
import { CMSItem } from "@features/cms/types/types";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { IconButton } from "@radix-ui/themes";
import _ from "lodash";
import { useDragLayer, useDrop } from "react-dnd";
import { useSetRecoilState } from "recoil";
import { twMerge } from "tailwind-merge";
import { CMSCard } from "./cms-card";
import { CMSItemModalAtom } from "./cms-items-modal";

type CMSColumnProps = {
  title: string;
  items: CMSItem[];
  onMove?: (value: CMSItem) => void;
  type: "new" | "qualified" | "proposal" | "won";
} & React.HTMLAttributes<HTMLDivElement>;

export const CMSColumn = ({ title, items, type, ...props }: CMSColumnProps) => {
  const { create } = useCMSItems();
  const { client } = useClients();

  const [__, dropRef] = useDrop(
    () => ({
      accept: "cms-item",
      drop: (value: CMSItem) => {
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

  const setCMSModal = useSetRecoilState(CMSItemModalAtom);

  return (
    <div
      className={twMerge("flex flex-col flex-1 p-3", props.className)}
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
              setCMSModal({
                open: true,
                type,
                onClose: () =>
                  setCMSModal((data) => ({ ...data, open: false })),
                onSave: (value) => {
                  create.mutate(value);
                },
              });
            }}
          >
            <PlusCircleIcon width="18" height="18" />
          </IconButton>
        </div>

        <div className="flex-1 grow">
          {items.map((item, index) => (
            <CMSCard
              key={item.id}
              cmsItem={item}
              className={twMerge(index === 0 && "mt-3")}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
