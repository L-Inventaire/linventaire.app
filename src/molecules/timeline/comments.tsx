import { getAvatarFullUrl, getFullName } from "@features/auth/utils";
import { useUser } from "@features/clients/state/use-client-users";
import { useComment } from "@features/comments/hooks/use-comments";
import { Comments } from "@features/comments/types/types";
import { PublicCustomer } from "@features/customers/types/customers";
import { useDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { RestEntity } from "@features/utils/rest/types/types";
import {
  ArrowUturnLeftIcon,
  FaceSmileIcon,
  InformationCircleIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
} from "@heroicons/react/16/solid";
import { EditorInput } from "@molecules/editor-input";
import {
  Avatar,
  Card,
  IconButton,
  Strong,
  Text,
  Tooltip,
} from "@radix-ui/themes";
import { format, formatDistance } from "date-fns";
import { useState } from "react";
import toast from "react-hot-toast";
import { EventLine } from ".";

export const CommentCard = ({
  id,
  item,
  viewRoute,
}: {
  id: string;
  item?: RestEntity & any;
  viewRoute?: string;
}) => {
  const { comment } = useComment(id);
  const { user } = useUser(comment?.created_by || "");

  if (!comment) return <></>;

  const fullName =
    getFullName(user?.user as PublicCustomer) || user?.user?.email || "Unknown";
  if (comment.type === "event" && item) {
    return (
      <EventLine
        comment={{
          id: comment.id,
          created_by: comment.updated_by || comment.created_by,
          created_at: item.operation_timestamp || comment.created_at,
        }}
        name="-"
        viewRoute={viewRoute}
        revision={item.id + "~" + item.operation_timestamp}
        icon={(p) => <InformationCircleIcon className={p.className} />}
        message={comment.content}
      />
    );
  }

  return (
    <Card className="mb-2 mt-4 space-y-2 group/comment">
      <div className="w-full flex items-center space-x-2">
        <div className="w-4 h-4 flex items-start">
          <Avatar
            variant="solid"
            style={{ backgroundColor: "#FFD700" }}
            radius="full"
            className="w-4 h-4"
            size="1"
            src={
              getAvatarFullUrl((user?.user as PublicCustomer)?.avatar) ||
              undefined
            }
            fallback={fullName[0]}
          />
        </div>
        <Text size="2" className="text-gray-500 grow">
          <Strong className="text-black dark:text-white">{fullName}</Strong>
          {" - "}
          <Tooltip
            content={format(
              new Date(parseInt(comment.created_at || "0") || 0),
              "PPpp"
            )}
          >
            <span>
              {formatDistance(new Date(comment.created_at || 0), new Date(), {
                addSuffix: true,
              })}
            </span>
          </Tooltip>
        </Text>
        {!!comment.content && (
          <div className="flex items-center space-x-2 group-hover/comment:opacity-100 opacity-0 transition-all">
            <Tooltip content="Ajouter une réaction">
              <IconButton variant="ghost" radius="full" size="1">
                <FaceSmileIcon className="w-4 h-4" />
              </IconButton>
            </Tooltip>
            <Tooltip content="Répondre">
              <IconButton variant="ghost" radius="full" size="1">
                <ArrowUturnLeftIcon className="w-4 h-4" />
              </IconButton>
            </Tooltip>
          </div>
        )}
      </div>
      {!!comment.content && (
        <Text size="3" className="block">
          <EditorInput disabled value={comment.content} placeholder="" />
        </Text>
      )}
    </Card>
  );
};

export const CommentCreate = ({
  entity,
  item,
}: {
  entity: string;
  item: string;
}) => {
  const { save } = useDraftRest<Comments>("comments", "new", async () => {});

  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);

  return (
    <Card className="space-y-2" variant="surface">
      <EditorInput
        disabled={false}
        value={comment}
        onChange={setComment}
        className="border-none bg-transparent dark:bg-transparent p-0"
        placeholder="Ajouter un commentaire..."
      />
      <div className="flex items-center space-x-2">
        <div className="grow" />
        <Tooltip content="Pièces jointes">
          <IconButton
            variant="ghost"
            radius="full"
            loading={loading}
            disabled={loading}
          >
            <PaperClipIcon className="w-4 h-4 -rotate-90" />
          </IconButton>
        </Tooltip>
        <Tooltip content="Envoyer">
          <IconButton
            loading={loading}
            variant="solid"
            radius="full"
            disabled={loading || !comment}
            onClick={async () => {
              setLoading(true);
              try {
                const val = await save({
                  item_entity: entity,
                  item_id: item,
                  content: comment,
                  documents: attachments,
                  type: "comment",
                  reactions: [],
                });
                if (!val) throw new Error("No value returned");
                setComment("");
                setAttachments([]);
              } catch (e) {
                console.error(e);
                toast.error("Impossible d'envoyer le commentaire.");
              } finally {
                setLoading(false);
              }
            }}
          >
            <PaperAirplaneIcon className="w-4 h-4 -rotate-90" />
          </IconButton>
        </Tooltip>
      </div>
    </Card>
  );
};
