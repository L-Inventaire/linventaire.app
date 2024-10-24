import { UsersInput } from "@components/input-rest/users";
import { getAvatarFullUrl, getFullName } from "@features/auth/utils";
import { useUser } from "@features/clients/state/use-client-users";
import { Comments } from "@features/comments/types/types";
import { PublicCustomer } from "@features/customers/types/customers";
import {
  ArchiveBoxArrowDownIcon,
  ArrowUturnLeftIcon,
  CodeBracketIcon,
  FaceSmileIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/16/solid";
import { EditorInput } from "@molecules/editor-input";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Heading,
  IconButton,
  Strong,
  Text,
  Tooltip,
} from "@radix-ui/themes";
import { formatDistance } from "date-fns";
import { ReactNode, useState } from "react";
import { twMerge } from "tailwind-merge";

export const Timeline = ({ entity, id }: { entity: string; id: string }) => {
  return (
    <>
      <div className="flex items-center space-x-2">
        <Heading size="4" className="grow">
          Activity
        </Heading>
        <Tooltip content="Subscribe to changes on this document.">
          <Button size="2" variant="ghost">
            Subscribe
          </Button>
        </Tooltip>
        <UsersInput
          data-tooltip="Change subscribers"
          size="md"
          onChange={() => {}}
          value={[]}
          disabled={false}
        />
      </div>

      <div className="mt-3">
        <EventLine
          comment={{
            id: "1",
            content: "created this document",
            owner_id: "4b230201-6d25-4be6-9baf-23c13f1bcd9d",
            created_at: (Date.now() - 1000 * 60 * 60) as any,
          }}
          first
        />

        <CommentCard
          comment={{
            id: "1",
            content: "Hey all, first comments on this timeline! 🚀",
            owner_id: "4b230201-6d25-4be6-9baf-23c13f1bcd9d",
            created_at: (Date.now() - 1000 * 60 * 54) as any,
          }}
        />

        <EventLine
          comment={{
            id: "1",
            content: "webhook sent",
            owner_id: "system",
            created_at: (Date.now() - 1000 * 60 * 45) as any,
          }}
          name="System"
          icon={(p) => <CodeBracketIcon {...p} />}
          first
        />
        <EventLine
          comment={{
            id: "1",
            content: "Hey, premier mock de commentaire ! 🚀",
            owner_id: "4b230201-6d25-4be6-9baf-23c13f1bcd9d",
            created_at: (Date.now() - 1000 * 60 * 30) as any,
          }}
          icon={(p) => <PencilIcon {...p} />}
          message="updated the document"
        />
        <EventLine
          comment={{
            id: "1",
            content: "Hey, premier mock de commentaire ! 🚀",
            owner_id: "4b230201-6d25-4be6-9baf-23c13f1bcd9d",
            created_at: (Date.now() - 1000 * 60 * 15) as any,
          }}
          icon={(p) => (
            <TrashIcon className={twMerge(p.className, "text-red-500")} />
          )}
          message={
            <>
              <Badge color="red">deleted</Badge> this document
            </>
          }
        />
        <EventLine
          comment={{
            id: "1",
            content: "Hey, premier mock de commentaire ! 🚀",
            owner_id: "4b230201-6d25-4be6-9baf-23c13f1bcd9d",
            created_at: (Date.now() - 1000 * 60 * 5) as any,
          }}
          icon={(p) => (
            <ArchiveBoxArrowDownIcon
              className={twMerge(p.className, "text-green-500")}
            />
          )}
          message={
            <>
              <Badge color="green">restored</Badge> this document
            </>
          }
          first
        />
        <EventLine
          comment={{
            id: "1",
            content: "Hey, premier mock de commentaire ! 🚀",
            owner_id: "4b230201-6d25-4be6-9baf-23c13f1bcd9d",
            created_at: Date.now() as any,
          }}
          icon={(p) => <PencilIcon {...p} />}
          message="updated the document"
        />
      </div>
      <div className="mt-6">
        <CommentCreate onComment={() => {}} />
      </div>
    </>
  );
};

const EventLine = ({
  comment,
  first,
  message,
  icon,
  name,
}: {
  comment: Partial<Comments>;
  first?: boolean;
  message?: string | ReactNode;
  icon?: (props: { className: string }) => ReactNode;
  name?: string;
}) => {
  const { user } = useUser(comment.owner_id || "");
  const fullName =
    getFullName(user?.user as PublicCustomer) || user?.user?.email || "Unknown";
  return (
    <div className="flex items-center space-x-2 mt-3 mx-1.5">
      <div className="w-6 h-6 relative -mr-1">
        {!icon && (
          <Avatar
            variant="solid"
            style={{ backgroundColor: "#FFD700" }}
            className="w-4 h-4 m-1"
            radius="full"
            size="1"
            src={
              getAvatarFullUrl((user?.user as PublicCustomer)?.avatar) ||
              undefined
            }
            fallback={fullName[0]}
          />
        )}
        {!!icon && icon({ className: "w-4 h-4 m-1 text-gray-500" })}
        {!first && (
          <div className="absolute bg-slate-100 dark:bg-slate-700 bottom-6 left-0 right-0 mx-auto w-px h-3" />
        )}
      </div>
      <Text size="2" className="text-gray-500">
        <Strong truncate className="text-black dark:text-white">
          {name || fullName}
        </Strong>{" "}
        {message || comment?.content} •{" "}
        {formatDistance(new Date(comment.created_at || 0), new Date(), {
          addSuffix: true,
        })}
      </Text>
    </div>
  );
};

const CommentCard = ({ comment }: { comment: Partial<Comments> }) => {
  const { user } = useUser(comment.owner_id || "");
  const fullName =
    getFullName(user?.user as PublicCustomer) || user?.user?.email || "Unknown";
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
          <Strong className="text-black dark:text-white">{fullName}</Strong>{" "}
          {formatDistance(new Date(comment.created_at || 0), new Date(), {
            addSuffix: true,
          })}
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

const CommentCreate = (props: {
  loading?: boolean;
  onComment: (comment: string, attachments: string[]) => void;
}) => {
  const [comment, setComment] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);

  return (
    <Card className="space-y-2" variant="surface">
      <EditorInput
        disabled={props.loading || false}
        value={comment}
        onChange={setComment}
        className="border-none bg-transparent dark:bg-transparent p-0"
        placeholder="Leave a comment..."
      />
      <div className="flex items-center space-x-2">
        <div className="grow" />
        <Tooltip content="Pièces jointes">
          <IconButton
            variant="ghost"
            radius="full"
            loading={props.loading}
            disabled={props.loading}
          >
            <PaperClipIcon className="w-4 h-4 -rotate-90" />
          </IconButton>
        </Tooltip>
        <Tooltip content="Envoyer">
          <IconButton
            loading={props.loading}
            variant="solid"
            radius="full"
            disabled={props.loading || !comment}
            onClick={() => {
              props.onComment(comment, attachments);
            }}
          >
            <PaperAirplaneIcon className="w-4 h-4 -rotate-90" />
          </IconButton>
        </Tooltip>
      </div>
    </Card>
  );
};
