import { UsersInput } from "@components/input-rest/users";
import { getAvatarFullUrl, getFullName } from "@features/auth/utils";
import { useUser } from "@features/clients/state/use-client-users";
import { Comments } from "@features/comments/types/types";
import { PublicCustomer } from "@features/customers/types/customers";
import { getRoute } from "@features/routes";
import { useNavigateAlt } from "@features/utils/navigate";
import { useRestHistory } from "@features/utils/rest/hooks/use-history";
import { RestEntity } from "@features/utils/rest/types/types";
import { EyeIcon } from "@heroicons/react/24/outline";
import {
  Avatar,
  Button,
  Callout,
  Heading,
  IconButton,
  Strong,
  Text,
  Tooltip,
} from "@radix-ui/themes";
import { format, formatDistance } from "date-fns";
import _ from "lodash";
import { ReactNode } from "react";
import { CommentCreate } from "./comments";
import { getEventLine, prepareHistory } from "./events";
import { formatTime } from "@features/utils/format/dates";

export const Timeline = ({
  entity,
  id,
  viewRoute,
}: {
  entity: string;
  id: string;
  viewRoute?: string;
}) => {
  const isRevision = (id || "").includes("~");
  const revision = (id || "").split("~")[1];
  const navigate = useNavigateAlt();

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
      {isRevision && (
        <Callout.Root className="text-center mb-4" color="bronze">
          <div>
            Vous consultez une version antérieure datant du{" "}
            {formatTime(revision)}.
            {viewRoute && (
              <Button
                onClick={() =>
                  navigate(getRoute(viewRoute, { id: id.split("~")[0] }))
                }
                variant="solid"
                className="block text-center mt-2"
              >
                Retourner à la version actuelle
              </Button>
            )}
          </div>
        </Callout.Root>
      )}

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
              created_by: data?.pages[0]?.list[0].created_by,
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
        {prepareHistory(history, hasNextPage, { viewRoute }).map(getEventLine)}
      </div>
      {!current.is_deleted && (
        <div className="mt-6">
          <CommentCreate entity={entity} item={id} />
        </div>
      )}
    </>
  );
};

export const EventLine = ({
  comment,
  first,
  message,
  icon,
  name,
  revision,
  viewRoute,
}: {
  comment: Partial<Comments>;
  first?: boolean;
  message?: string | ReactNode;
  icon?: (props: { className: string }) => ReactNode;
  name?: string;
  revision?: string;
  viewRoute?: string;
}) => {
  const navigate = useNavigateAlt();
  const { user } = useUser(comment.created_by || "");
  const fullName =
    getFullName(user?.user as PublicCustomer) || user?.user?.email || "Unknown";
  return (
    <div className="flex items-center space-x-2 mt-3 mx-1.5 group/event">
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
      {!!viewRoute && !!revision && (
        <IconButton
          data-tooltip="Ouvrir cette version"
          className="group-hover/event:opacity-100 opacity-0"
          onClick={(event: any) =>
            navigate(getRoute(viewRoute, { id: revision }), { event })
          }
          variant="ghost"
        >
          <EyeIcon className="w-4 h-4" />
        </IconButton>
      )}
    </div>
  );
};
