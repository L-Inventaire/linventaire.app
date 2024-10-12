import { FilesInput } from "@components/input-rest/files";
import { UsersInput } from "@components/input-rest/users";
import { getAvatarFullUrl, getFullName } from "@features/auth/utils";
import {
  useClientUsers,
  useUser,
} from "@features/clients/state/use-client-users";
import { Comments } from "@features/comments/types/types";
import { PublicCustomer } from "@features/customers/types/customers";
import {
  ArrowUturnLeftIcon,
  FaceSmileIcon,
  HandThumbUpIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
} from "@heroicons/react/16/solid";
import { EditorInput } from "@molecules/editor-input";
import {
  Avatar,
  Button,
  Card,
  Heading,
  IconButton,
  Separator,
  Strong,
  Text,
  Tooltip,
} from "@radix-ui/themes";
import { formatDistance } from "date-fns";
import { useState } from "react";

export const Timeline = ({ entity, id }: { entity: string; id: string }) => {
  return (
    <>
      <div className="flex items-center space-x-2">
        <Heading size="4" className="grow">
          Activité
        </Heading>
        <Tooltip content="Subscribe to changes on this document.">
          <Button size="2" variant="ghost">
            Unsubscribe
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
        {[1, 1].map((a, i) => (
          <div className="flex items-center space-x-2 mt-2">
            <div className="w-6 h-6 relative">
              <Avatar
                variant="solid"
                style={{ backgroundColor: "#FFD700" }}
                className="w-4 h-4 m-1"
                radius="full"
                size="1"
                src="https://www.gravatar.com/avatar/c1bd974477471c6a0287e3262082a2a7?rating=PG&size=100&default=identicon%202x"
                fallback="RM"
              />
              {i !== 0 && (
                <div className="absolute bg-slate-100 dark:bg-slate-700 bottom-6 left-0 right-0 mx-auto w-px h-2" />
              )}
            </div>
            <Text size="2" className="text-gray-500">
              <Strong className="text-black dark:text-white">
                Romaric Mourgues
              </Strong>{" "}
              a créé ce document •{" "}
              {formatDistance(new Date("2024-10-10"), new Date(), {
                addSuffix: true,
              })}
            </Text>
          </div>
        ))}

        <CommentCard
          comment={{
            id: "1",
            content: "Hey, premier mock de commentaire ! 🚀",
            owner_id: "4b230201-6d25-4be6-9baf-23c13f1bcd9d",
          }}
        />
      </div>
      <div className="mt-4">
        <CommentCreate onComment={() => {}} />
      </div>
    </>
  );
};

const CommentCard = ({ comment }: { comment: Partial<Comments> }) => {
  const { user } = useUser(comment.owner_id || "");
  const fullName =
    getFullName(user?.user as PublicCustomer) || user?.user?.email || "Unknown";
  return (
    <Card className="mt-2 space-y-2 group/comment">
      <div className="w-full flex items-center space-x-2">
        <div className="w-6 h-6">
          <Avatar
            variant="solid"
            style={{ backgroundColor: "#FFD700" }}
            radius="full"
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
        placeholder="Ajouter un commentaire..."
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
