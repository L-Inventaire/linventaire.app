import { SectionSmall } from "@atoms/text";
import { CMSItem } from "@features/cms/types/types";
import _ from "lodash";
import { useDrag, useDragLayer, useDrop } from "react-dnd";
import { twMerge } from "tailwind-merge";

type CMSCardProps = {
  title?: string;
  readonly?: boolean;
  cmsItem: CMSItem;
  onMove?: (value: CMSItem) => void;
} & React.HTMLAttributes<HTMLDivElement>;

export const CMSCard = ({
  title,
  cmsItem,
  readonly,
  ...props
}: CMSCardProps) => {
  const [{ dragging }, dragRef] = useDrag(
    () => ({
      canDrag: !readonly,
      type: "invoice-line",
      item: cmsItem,
      collect: (monitor) => ({
        dragging: monitor.isDragging() ? true : false,
      }),
    }),
    [cmsItem, readonly]
  );

  const { isDragging } = useDragLayer((monitor) => ({
    isDragging: monitor.isDragging(),
  }));

  return (
    <div
      ref={dragRef}
      className={twMerge(
        "min-w-52 -mx-2 border border-x-0 border-b-slate-50 border-t-slate-50",
        props.className
      )}
      {..._.omit(props, "className")}
    >
      <SectionSmall className="p-3">{title || "TEST"}</SectionSmall>
    </div>
  );
};
