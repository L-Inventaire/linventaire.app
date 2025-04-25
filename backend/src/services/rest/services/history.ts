import _ from "lodash";
import { default as Framework, default as platform } from "../../../platform";
import { TransactionOperation } from "../../../platform/db/api";
import { EventsDefinition } from "../../../services/system/entities/events";
import { TasksDefinition } from "../../../services/system/entities/tasks";
import { Context } from "../../../types";
import { RestEntity } from "../entities/entity";
import { isTableAvailable } from "./utils";
import Clients, {
  ClientsDefinition,
} from "#src/services/clients/entities/clients";

export const insertIntoHistory = async (
  ctx: Context,
  table: string,
  neew: RestEntity,
  old: RestEntity
) => {
  const { columns } = Framework.TriggersManager.getEntities()[table] || {};

  const historyTable = table + "_history";
  const driver = await platform.Db.getService();
  await driver.insert(
    ctx,
    historyTable,
    {
      ..._.pick(
        _.omit(
          (neew || old) as RestEntity,
          "searchable",
          "searchable_generated",
          "comment_id"
        ),
        Object.keys(columns)
      ),
      ...(columns?.is_deleted
        ? {
            is_deleted: !neew ? true : false,
          }
        : {}),
      ...(columns?.comment_id
        ? {
            comment_id:
              neew?.comment_id !== old?.comment_id ? neew?.comment_id : null,
          }
        : {}),
      operation: (!neew
        ? "delete"
        : !old
        ? "insert"
        : "update") as TransactionOperation<any>["operation"],
      operation_timestamp: new Date().getTime(),
    },
    { triggers: false }
  );
};

export const setupHistoryTrigger = () => {
  // For any change in an entity, save the previous version in the history table
  Framework.TriggersManager.registerTrigger("*", {
    test: (_ctx, _n, _o, { table, depth }) => {
      return (
        depth === 0 &&
        table !== EventsDefinition.name &&
        table !== TasksDefinition.name &&
        !(
          table === ClientsDefinition.name &&
          _.isEqual(
            _.omit((_n || {}) as Clients, "invoices_counters"),
            _.omit((_o || {}) as Clients, "invoices_counters")
          )
        )
      );
    },
    callback: async (
      ctx,
      neew: RestEntity | null,
      old: RestEntity | null,
      { table }
    ) => {
      const { auditable } =
        Framework.TriggersManager.getEntities()[table] || {};

      if (auditable) {
        await insertIntoHistory(ctx, table, neew, old);
      }
    },
    name: "history-triggers",
    priority: 1000, // Always do it after everything else
  });
};

/** Retrieve past versions of a document */
export const searchHistory = async <T>(
  ctx: Context,
  table: string,
  id: string,
  limit: number,
  offset: number
) => {
  if (!(await isTableAvailable(ctx, table, "READ")))
    throw new Error("Invalid object type");
  const driver = await platform.Db.getService();
  const historyTable = table + "_history";

  const result = await driver.select<T>(
    ctx,
    historyTable,
    {
      id,
      client_id: ctx.client_id,
    },
    {
      limit,
      offset,
      asc: false,
      index: "operation_timestamp",
      include_deleted: true,
    }
  );

  const total = await driver.count(
    ctx,
    historyTable,
    {
      id,
      client_id: ctx.client_id,
    },
    {
      include_deleted: true,
    }
  );

  return { total, list: result, has_more: total > limit + offset };
};
