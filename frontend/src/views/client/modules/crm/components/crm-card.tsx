import { Tag } from "@/atoms/badge/tag";
import { TagsInput } from "@components/input-rest/tags";
import { UsersInput } from "@components/input-rest/users";
import { generateQueryFromMap } from "@components/search-bar/utils/utils";
import { useContacts } from "@features/contacts/hooks/use-contacts";
import { CRMItem } from "@features/crm/types/types";
import { useViewWithCtrlK } from "@features/ctrlk/use-edit-from-ctrlk";
import { Card, Heading, Text } from "@radix-ui/themes";
import DOMPurify from "dompurify";
import _ from "lodash";
import { useDrag, useDragLayer } from "react-dnd";
import { twMerge } from "tailwind-merge";
import { prettyContactName } from "../../contacts/utils";

const cleanHTML = (notes: string) => {
  // First sanitize with DOMPurify
  let cleaned = DOMPurify.sanitize(notes || "", {
    ALLOWED_TAGS: ["b", "i", "u", "em", "strong", "p", "br", "ul", "ol", "li"],
    ALLOWED_ATTR: [],
  });

  // Remove empty paragraphs and elements
  cleaned = cleaned
    // Remove <p><br></p>, <p><br/></p>, <p><br /></p>
    .replace(/<p[^>]*>\s*<br\s*\/?>\s*<\/p>/gi, "")
    // Remove empty paragraphs <p></p> or <p> </p>
    .replace(/<p[^>]*>\s*<\/p>/gi, "")
    // Remove multiple consecutive <br> tags (more than 2)
    .replace(/(<br\s*\/?>){3,}/gi, "<br><br>")
    // Remove leading/trailing <br> tags
    .replace(/^(\s*<br\s*\/?>)+/gi, "")
    .replace(/(<br\s*\/?>)+\s*$/gi, "")
    // Remove empty list items
    .replace(/<li[^>]*>\s*<\/li>/gi, "")
    // Remove empty lists
    .replace(/<(ul|ol)[^>]*>\s*<\/(ul|ol)>/gi, "")
    // Trim whitespace
    .trim();

  return cleaned;
};

type CRMCardProps = {
  title?: string;
  readonly?: boolean;
  crmItem: CRMItem;
  onMove?: (value: CRMItem) => void;
} & React.HTMLAttributes<HTMLDivElement>;

export const CRMCard = ({ crmItem, readonly, ...props }: CRMCardProps) => {
  const onEdit = useViewWithCtrlK();

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
    <Card
      ref={dragRef as any}
      className={twMerge("w-full min-w-0 overflow-hidden", props.className)}
      {..._.omit(props, "className")}
      onClick={() => {
        onEdit(
          "crm_items",
          crmItem.id,
          undefined,
          readonly ? async () => {} : undefined
        );
      }}
    >
      <Text
        size="2"
        className="min-w-0 break-words w-full overflow-hidden text-ellipsis block mb-1 gap-1 flex flex-wrap"
      >
        {(crmItem.contacts ?? [])
          .map((id) => {
            const contact = contacts.find((c) => c.id === id);
            if (!contact) return false;
            return prettyContactName(contact);
          })
          .filter(Boolean)
          .map((name) => (
            <Tag size="xs">{name?.toString().trim()}</Tag>
          ))}
      </Text>
      <Heading size="4" className="min-w-0 w-full">
        <div className="relative editor-input min-w-0 w-full overflow-hidden">
          <div
            className={twMerge(
              "ql-editor is-disabled min-w-0 break-words overflow-wrap-anywhere w-full whitespace-pre-wrap -ml-1"
            )}
            style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
            dangerouslySetInnerHTML={{ __html: cleanHTML(crmItem.notes) || "" }}
          ></div>
        </div>
      </Heading>
      <div className="mt-1 min-w-0 w-full overflow-hidden">
        <div className="float-right min-w-0 max-w-[45%] overflow-hidden">
          <div className="space-x-1 min-w-0 flex flex-wrap gap-1">
            <TagsInput value={crmItem.tags} disabled size="sm" />
            <UsersInput value={crmItem.assigned} disabled size="sm" />
          </div>
        </div>
        <div className="min-w-0 overflow-hidden max-w-[55%]">
          <UsersInput value={[crmItem.seller]} disabled={true} />
        </div>
      </div>
    </Card>
  );
};
