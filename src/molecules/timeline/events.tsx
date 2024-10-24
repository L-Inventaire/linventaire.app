import { RestEntity } from "@features/utils/rest/types/types";
import {
  ArchiveBoxArrowDownIcon,
  CodeBracketIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/16/solid";
import { Badge } from "@radix-ui/themes";
import _ from "lodash";
import { Fragment } from "react/jsx-runtime";
import { twMerge } from "tailwind-merge";
import { EventLine } from ".";
import { CommentCard } from "./comments";

type PreparedEventLine = {
  isIgnore: boolean;
  isComment: boolean;
  isDeleted: boolean;
  isRestore: boolean;
  isEdit: boolean;
  isFirstInLine: boolean;
  key: string;
  item: RestEntity & any;
  previousItem: RestEntity & any;
};

export const prepareHistory = (
  history: (RestEntity & any)[],
  hasNextPage: boolean
) => {
  return history.map((a, i) => {
    const isIgnore = i === 0 && !hasNextPage;

    const prev = history[i - 1] || {};
    const isComment = !!a.comment_id;

    const isFirstInLine =
      (i === 0 && hasNextPage) ||
      (!a.is_deleted && prev.is_deleted) ||
      !!prev.comment_id;

    const isDeleted = a.is_deleted;
    const isRestore = prev.is_deleted && !isDeleted;
    const isEdit = !isDeleted && !isRestore && a.revisions > prev?.revisions;

    return {
      isIgnore,
      isComment,
      isDeleted,
      isRestore,
      isEdit,
      isFirstInLine,
      key: `${a.revisions}-${a.operation_timestamp}`,
      item: a,
      previousItem: prev,
    } as PreparedEventLine;
  });
};

export const getEventLine = ({
  isIgnore,
  isComment,
  isDeleted,
  isRestore,
  isEdit,
  isFirstInLine,
  key,
  item,
  previousItem,
}: PreparedEventLine) => {
  const a = item;
  const prev = previousItem;

  if (isIgnore) {
    return <Fragment key={key} />;
  }

  if (isComment) {
    return <CommentCard key={key} id={a.comment_id} />;
  }

  if (isDeleted) {
    return (
      <EventLine
        key={key}
        comment={{
          id: a.revisions.toString(),
          created_by: a.updated_by || a.created_by,
          created_at: a.operation_timestamp || a.created_at,
        }}
        first={isFirstInLine}
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
        key={key}
        comment={{
          id: a.revisions.toString(),
          created_by: a.updated_by || a.created_by,
          created_at: a.operation_timestamp || a.created_at,
        }}
        first={isFirstInLine}
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

  if (isEdit) {
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
    ).forEach((key) => {
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
        key={key}
        first={isFirstInLine}
        comment={{
          id: a.revisions.toString(),
          created_by: a.updated_by || a.created_by,
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

  return <Fragment key={key} />;
};
