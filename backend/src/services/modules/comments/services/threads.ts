import { id } from "#src/platform/db/utils";
import platform from "#src/platform/index";
import { Context } from "#src/types";
import _ from "lodash";
import Threads, { ThreadsDefinition } from "../entities/threads";

export const addUsersToThread = async (
  ctx: Context,
  clientId: string,
  itemEntity: string,
  itemId: string,
  users: string[]
) => {
  const db = await platform.Db.getService();
  const thread = await db.selectOne<Threads>(ctx, ThreadsDefinition.name, {
    client_id: clientId,
    item_entity: itemEntity,
    item_id: itemId,
  });
  if (!thread) {
    // Create a new thread
    await db.insert<Partial<Threads>>(ctx, ThreadsDefinition.name, {
      id: id(),
      client_id: clientId,
      item_entity: itemEntity,
      item_id: itemId,
      subscribers: [...users],
      is_deleted: false,
    });
  } else {
    await db.update<Threads>(
      ctx,
      ThreadsDefinition.name,
      {
        client_id: clientId,
        item_entity: itemEntity,
        item_id: itemId,
      },
      {
        is_deleted: false,
        subscribers: _.uniq([...thread.subscribers, ...users]),
      }
    );
  }
};

export const removeUsersFromThread = async (
  ctx: Context,
  clientId: string,
  itemEntity: string,
  itemId: string,
  users: string[]
) => {
  const db = await platform.Db.getService();
  const thread = await db.selectOne<Threads>(ctx, ThreadsDefinition.name, {
    client_id: clientId,
    item_entity: itemEntity,
    item_id: itemId,
  });
  if (!thread) {
    return;
  } else {
    await db.update<Threads>(
      ctx,
      ThreadsDefinition.name,
      {
        client_id: clientId,
        item_entity: itemEntity,
        item_id: itemId,
      },
      {
        subscribers: thread.subscribers.filter((a) => !users.includes(a)),
      }
    );
  }
};

export const clearThread = async (
  ctx: Context,
  clientId: string,
  itemEntity: string,
  itemId: string
) => {
  const db = await platform.Db.getService();
  await db.update<Threads>(
    ctx,
    ThreadsDefinition.name,
    {
      client_id: clientId,
      item_entity: itemEntity,
      item_id: itemId,
    },
    {
      subscribers: [],
    }
  );
};
