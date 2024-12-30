import { SectionSmall } from "@atoms/text";
import { CMSItem } from "@features/cms/types/types";
import { useContacts } from "@features/contacts/hooks/use-contacts";
import _ from "lodash";
import { useDrag, useDragLayer } from "react-dnd";
import { twMerge } from "tailwind-merge";
import { prettyContactName } from "../../contacts/utils";

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
  const [dragRef] = useDrag(
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

  useDragLayer((monitor) => ({
    isDragging: monitor.isDragging(),
  }));

  const { contacts } = useContacts({
    query: [
      {
        key: "id",
        values: (cmsItem?.contacts ?? []).map((id) => ({
          op: "equals",
          value: id,
        })),
      },
    ],
    key: "contacts_" + (cmsItem?.contacts ?? []).join("_"),
  });
  return (
    <div
      ref={dragRef as any}
      className={twMerge(
        "min-w-52 -mx-2 border border-x-0 border-b-slate-50 border-t-slate-50",
        props.className
      )}
      {..._.omit(props, "className")}
    >
      <SectionSmall className="p-3">
        {title ||
          (cmsItem.contacts ?? [])
            .map((id) => {
              const contact = (contacts.data?.list ?? []).find(
                (c) => c.id === id
              );
              if (!contact) return false;
              return prettyContactName(contact);
            })
            .filter(Boolean)
            .join(", ")}
      </SectionSmall>
    </div>
  );
};
