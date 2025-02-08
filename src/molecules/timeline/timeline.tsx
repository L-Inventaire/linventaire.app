import { formatTime } from "@features/utils/format/dates";
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
  isRestoreOldVersion: boolean;
  isDeleted: boolean;
  isComment: boolean;
  isRestore: boolean;
  isEdit: boolean;
  isFirstInLine: boolean;
  viewRoute?: string;
  key: string;
  item: RestEntity & any;
  previousItem: RestEntity & any;
};

export const prepareHistory = (
  history: (RestEntity & any)[],
  hasNextPage: boolean,
  options: { viewRoute?: string } = {}
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
    const isEdit =
      !isDeleted &&
      !isRestore &&
      (a.revisions > prev?.revisions ||
        a.operation_timestamp - prev?.operation_timestamp >
          1000 * 60 * 60 * 24);
    const isRestoreOldVersion =
      a.restored_from && a.restored_from !== prev.restored_from;

    return {
      isIgnore,
      isRestoreOldVersion,
      isComment,
      isDeleted,
      isRestore,
      isEdit,
      isFirstInLine,
      viewRoute: options.viewRoute,
      key: `${a.revisions}-${a.operation_timestamp}`,
      item: a,
      previousItem: prev,
    } as PreparedEventLine;
  });
};

export const getEventLine = (
  {
    isIgnore,
    isRestoreOldVersion,
    isComment,
    isDeleted,
    isRestore,
    isEdit,
    isFirstInLine,
    viewRoute,
    key,
    item,
    previousItem,
  }: PreparedEventLine,
  translations?: {
    [key: string]:
      | string
      | { label: string; values?: { [key: string]: string } };
  }
) => {
  const a = item;
  const prev = previousItem;

  if (isIgnore) {
    return <Fragment key={key} />;
  }

  if (isComment) {
    return <CommentCard key={key} id={a.comment_id} item={a} />;
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
        viewRoute={viewRoute}
        revision={a.id + "~" + a.operation_timestamp}
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
        viewRoute={viewRoute}
        revision={a.id + "~" + a.operation_timestamp}
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

  if (isRestoreOldVersion) {
    return (
      <EventLine
        key={key}
        comment={{
          id: a.revisions.toString(),
          created_by: a.updated_by || a.created_by,
          created_at: a.operation_timestamp || a.created_at,
        }}
        viewRoute={viewRoute}
        revision={a.id + "~" + a.operation_timestamp}
        first={isFirstInLine}
        icon={(p) => (
          <ArchiveBoxArrowDownIcon
            className={twMerge(p.className, "text-yellow-700")}
          />
        )}
        message={
          <>
            a <Badge color="brown">restauré</Badge> la version du{" "}
            {formatTime(a.restored_from)}
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
        if (!(translations?.[key] as any)?.label) return;
        if (prevValue === undefined) {
          added.push(key);
        } else if (newValue === undefined) {
          removed.push(key);
        } else {
          changes.push(key);
        }
      }
    });

    if (changes.length === 0 && added.length === 0 && removed.length === 0) {
      return <Fragment key={key} />;
    }

    return (
      <EventLine
        key={key}
        first={isFirstInLine}
        viewRoute={viewRoute}
        revision={a.id + "~" + a.operation_timestamp}
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
                  <Badge color="orange">
                    {(translations?.[a] as any)?.label ||
                      translations?.[a] ||
                      a}
                  </Badge>
                ))}
              </>
            )}{" "}
            {added.length > 0 && (
              <>
                ajouté{" "}
                {changes.map((a) => (
                  <Badge color="green">
                    {(translations?.[a] as any)?.label ||
                      translations?.[a] ||
                      a}
                  </Badge>
                ))}
              </>
            )}{" "}
            {removed.length > 0 && (
              <>
                supprimé{" "}
                {changes.map((a) => (
                  <Badge color="green">
                    {(translations?.[a] as any)?.label ||
                      translations?.[a] ||
                      a}
                  </Badge>
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
