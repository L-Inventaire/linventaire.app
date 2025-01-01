import { SectionSmall } from "@atoms/text";
import { generateQueryFromMap } from "@components/search-bar/utils/utils";
import { CRMItem } from "@features/crm/types/types";
import { useContacts } from "@features/contacts/hooks/use-contacts";
import _ from "lodash";
import { useDrag, useDragLayer } from "react-dnd";
import { twMerge } from "tailwind-merge";
import { prettyContactName } from "../../contacts/utils";

type CRMCardProps = {
  title?: string;
  readonly?: boolean;
  crmItem: CRMItem;
  onMove?: (value: CRMItem) => void;
} & React.HTMLAttributes<HTMLDivElement>;

export const CRMCard = ({ crmItem, readonly, ...props }: CRMCardProps) => {
  const [__, dragRef] = useDrag(
    () => ({
      canDrag: !readonly,
      type: "crm-item",
      item: crmItem,
      collect: (monitor) => ({
        dragging: monitor.isDragging() ? true : false,
      }),
    }),
    [crmItem, readonly]
  );

  useDragLayer((monitor) => ({
    isDragging: monitor.isDragging(),
  }));

  const { contacts: contacts_raw } = useContacts({
    query: generateQueryFromMap({ id: crmItem.contacts }),
    key: "contacts_id",
  });

  const contacts = contacts_raw?.data?.list || [];

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
        {(crmItem.contacts ?? [])
          .map((id) => {
            const contact = contacts.find((c) => c.id === id);
            if (!contact) return false;
            return prettyContactName(contact);
          })
          .filter(Boolean)
          .join(", ")}
      </SectionSmall>
    </div>
  );
};
