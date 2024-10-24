import { UsersInput } from "@components/input-rest/users";
import { getAvatarFullUrl, getFullName } from "@features/auth/utils";
import { useUser } from "@features/clients/state/use-client-users";
import { Comments } from "@features/comments/types/types";
import { PublicCustomer } from "@features/customers/types/customers";
import { useRestHistory } from "@features/utils/rest/hooks/use-history";
import { RestEntity } from "@features/utils/rest/types/types";
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
import { format, formatDistance } from "date-fns";
import _ from "lodash";
import { ReactNode, useState } from "react";
import { twMerge } from "tailwind-merge";

export const Timeline = ({ entity, id }: { entity: string; id: string }) => {
  const { data, fetchNextPage, hasNextPage } = useRestHistory<
    RestEntity & {
      operation_timestamp: string;
      operation: string;
    }
  >(entity, id);

  const history = _.reverse(_.flatten(data?.pages.map((a) => a.list)) || []);
  const current = history[history.length - 1];

  if (!current) return <></>;

  return (
    <>
      <div className="flex items-center space-x-2">
        <Heading size="4" className="grow">
          Activité
        </Heading>
        <Tooltip content="Subscribe to changes on this document.">
          <Button size="2" variant="ghost">
            Être notifié
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
        {!!current && (
          <EventLine
            comment={{
              id: "created",
              content: "a créé ce document",
              owner_id: data?.pages[0]?.list[0].created_by,
              created_at: data?.pages[0]?.list[0].created_at,
            }}
            first
          />
        )}
        {hasNextPage && (
          <Button
            onClick={() => fetchNextPage()}
            variant="ghost"
            color="blue"
            className="ml-1 block text-center mt-2"
          >
            Voir plus...
          </Button>
        )}
        {history.map((a, i) => {
          const isFirst = i === 0 && !hasNextPage;
          if (isFirst) return <></>;

          const prev = history[i - 1] || {};
          const isComment = a.comment_id;

          if (isComment) {
            return <CommentCard comment={a} />;
          }

          const first =
            (i === 0 && hasNextPage) ||
            (!a.is_deleted && prev.is_deleted) ||
            !!prev.comment_id;

          const isDeleted = a.is_deleted;
          const isRestore = prev.is_deleted && !isDeleted;

          if (isDeleted) {
            return (
              <EventLine
                comment={{
                  id: a.revisions.toString(),
                  owner_id: a.updated_by || a.created_by,
                  created_at: a.operation_timestamp || a.created_at,
                }}
                first={first}
                icon={(p) => (
                  <TrashIcon className={twMerge(p.className, "text-red-500")} />
                )}
                message={
                  <>
                    a <Badge color="red">supprimé</Badge> ce document
                  </>
                }
              />
            );
          }

          if (isRestore) {
            return (
              <EventLine
                comment={{
                  id: a.revisions.toString(),
                  owner_id: a.updated_by || a.created_by,
                  created_at: a.operation_timestamp || a.created_at,
                }}
                first={first}
                icon={(p) => (
                  <ArchiveBoxArrowDownIcon
                    className={twMerge(p.className, "text-green-500")}
                  />
                )}
                message={
                  <>
                    a <Badge color="green">restauré</Badge> ce document
                  </>
                }
              />
            );
          }

          if (a.revisions > prev?.revisions) {
            // List keys that changed in the last revision, and mark all of them as: modified, added, or removed
            const changes: string[] = [];
            const added: string[] = [];
            const removed: string[] = [];
            Object.keys(
              _.omit(
                a,
                "updated_at",
                "updated_by",
                "comment_id",
                "is_deleted",
                "operation",
                "operation_timestamp",
                "revisions"
              )
            ).map((key) => {
              const prevValue = (prev as any)[key];
              const newValue = (a as any)[key];
              if (!_.isEqual(prevValue, newValue)) {
                if (prevValue === undefined) {
                  added.push(key);
                } else if (newValue === undefined) {
                  removed.push(key);
                } else {
                  changes.push(key);
                }
              }
            });

            return (
              <EventLine
                first={first}
                comment={{
                  id: a.revisions.toString(),
                  owner_id: a.updated_by || a.created_by,
                  created_at: a.operation_timestamp || a.created_at,
                }}
                name={a.updated_by === "system" ? "System" : undefined}
                icon={
                  a.updated_by === "system"
                    ? (p) => <CodeBracketIcon {...p} />
                    : (p) => <PencilIcon {...p} />
                }
                message={
                  <div className="space-x-1 inline-block">
                    a{" "}
                    {changes.length > 0 && (
                      <>
                        modifié{" "}
                        {changes.map((a) => (
                          <Badge color="orange">{a}</Badge>
                        ))}
                      </>
                    )}{" "}
                    {added.length > 0 && (
                      <>
                        ajouté{" "}
                        {changes.map((a) => (
                          <Badge color="green">{a}</Badge>
                        ))}
                      </>
                    )}{" "}
                    {removed.length > 0 && (
                      <>
                        supprimé{" "}
                        {changes.map((a) => (
                          <Badge color="green">{a}</Badge>
                        ))}
                      </>
                    )}
                  </div>
                }
              />
            );
          }

          return <></>;
        })}
      </div>
      {!current.is_deleted && (
        <div className="mt-6">
          <CommentCreate onComment={() => {}} />
        </div>
      )}
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
        <Tooltip
          content={format(
            new Date(parseInt(comment.created_at || "0") || 0),
            "PPpp"
          )}
        >
          <span>
            {formatDistance(
              new Date(parseInt(comment.created_at || "0") || 0),
              new Date(),
              {
                addSuffix: true,
              }
            )}
          </span>
        </Tooltip>
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
