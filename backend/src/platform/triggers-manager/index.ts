import { RestEntity } from "#src/services/rest/entities/entity";
import _ from "lodash";
import NodeCache from "node-cache";
import Framework from "..";
import { Role } from "../../services/clients/entities/clients-users";
import Event from "../../services/system/entities/events";
import { Context } from "../../types";
import { TableDefinition } from "../db/api";
import { Logger } from "../logger-db";
import Socket from "../socket";
import { PlatformService } from "../types";
import { RestSearchQuery } from "#src/services/rest/type";

type TriggerType<T> = {
  priority: number;
  id: string;
  name: string;
  test?: (
    ctx: Context,
    entity?: T | null,
    oldEntity?: T | null,
    meta?: { table: string; depth: number }
  ) => boolean;
  callback: (
    ctx: Context,
    entity?: T | null,
    oldEntity?: T | null,
    meta?: { table: string; depth: number }
  ) => Promise<void>;
};

const cachedEvents = new NodeCache({ stdTTL: 600 });

export default class TriggersManager implements PlatformService {
  private logger: Logger;
  private socket: Socket;
  private entities: { [entity: string]: TableDefinition };
  private entitiesRoles: {
    [entity: string]:
      | {
          READ: Role;
          WRITE: Role;
          MANAGE: Role;
        }
      | ((
          ctx: Context,
          entity: any,
          action?: "MANAGE" | "READ" | "WRITE"
        ) => Promise<boolean>);
  } = {};
  private triggers: { [entity: string]: TriggerType<any>[] };

  constructor(socket: Socket) {
    this.logger = Framework.LoggerDb.get("triggers");
    this.socket = socket;
    this.triggers = {};
    this.entities = {};
  }

  async init() {
    return this;
  }

  getEntities() {
    return this.entities;
  }

  getEntitiesRoles() {
    return this.entitiesRoles;
  }

  hasEntitiesRole(
    ctx: Context,
    name: string,
    action: "MANAGE" | "READ" | "WRITE",
    entity: any
  ) {
    const r = this.entitiesRoles[name];
    if (!r) return false;
    return typeof r === "function"
      ? r(ctx, entity, action)
      : r[action.toUpperCase()];
  }

  registerEntities<T>(
    entities: TableDefinition[],
    roles:
      | {
          READ: Role;
          WRITE: Role;
          MANAGE: Role;
        }
      | ((
          ctx: Context,
          entity?: Partial<T> | RestSearchQuery[],
          action?: "MANAGE" | "READ" | "WRITE"
        ) => Promise<boolean>) = {
      READ: "CLIENT_MANAGE",
      WRITE: "CLIENT_MANAGE",
      MANAGE: "CLIENT_MANAGE",
    }
  ) {
    for (const entity of entities) {
      this.entities[entity.name] = entity;
      this.entitiesRoles[entity.name] = roles;
    }
  }

  registerTrigger<T>(
    entity: TableDefinition | "*",
    options: {
      callback: TriggerType<T>["callback"];
      test?: TriggerType<T>["test"];
      name?: string;
      priority?: number;
    }
  ) {
    const { callback, test, name, priority } = options;

    const table = entity === "*" ? "*" : entity.name;

    if (!this.triggers[table]) {
      this.triggers[table] = [];
    }
    const id = table + "_" + this.triggers[table].length + 1;
    if (entity !== "*") this.entities[table] = entity;
    this.triggers[table].push({
      priority: priority || 100,
      callback,
      test,
      id,
      name: name || `Trigger on ${table}`,
    });

    this.logger.info(null, `registered trigger ${id} (${name})`);
  }

  /* Cache entities to make sure we use the latest one even for late triggers */
  cache: { [key: string]: { [key: string]: { [key: string]: any } } } = {};

  // Called by db when a change is made to an entity
  async trigger<T>(
    ctx: Context,
    table: string,
    entity: T | null,
    oldEntity: T | null
  ) {
    if (!ctx.client_id) return;

    if (entity) {
      this.cache[ctx.client_id] = this.cache[ctx.client_id] || {};
      this.cache[ctx.client_id][table] = this.cache[ctx.client_id][table] || {};
      this.cache[ctx.client_id][table][(entity as any).id] = entity;
    }

    if (entity && (entity as RestEntity)?.is_deleted) {
      entity = null;
    }

    if (oldEntity && (oldEntity as RestEntity)?.is_deleted) {
      oldEntity = null;
    }

    if (!entity && !oldEntity) {
      throw new Error(
        "Entity is deleted and can't be modified on table " + table
      );
    }

    const action = !entity ? "delete" : !oldEntity ? "create" : "update";
    const pk = _.pick(entity || oldEntity, this.entities[table].pk);

    let rootTrigger = false;
    if ((ctx.trigger_path || []).length === 0) {
      rootTrigger = true;
    }

    if ((ctx.trigger_path || []).length > 20) {
      throw new Error(
        "Circular trigger detected: " + ctx.trigger_path?.join(" -> ")
      );
    }

    const triggers = [
      ...(this.triggers[table] || []),
      ...(this.triggers["*"] || []),
    ];
    if (triggers && triggers.length > 0) {
      triggers.sort((a, b) => a.priority - b.priority);

      for (const trigger of triggers) {
        const subCtx = {
          ...ctx,
          trigger_path: [...(ctx.trigger_path || []), trigger.name],
        };

        if (
          trigger.test &&
          !trigger.test(subCtx, entity, oldEntity, {
            table,
            depth: (ctx.trigger_path || []).length,
          })
        ) {
          continue;
        }

        this.logger.info(
          ctx,
          `running trigger ${table} (${(ctx.trigger_path || []).join(
            " > "
          )} > ${trigger.name || trigger.id})`
        );

        // This part is running the callback of the trigger
        await trigger.callback(
          subCtx,
          entity
            ? // We use the last to date known entity because it could have been modified by other triggers in the meanwhile
              this.cache[ctx.client_id][table][(entity as any).id]
            : entity,
          oldEntity,
          {
            table,
            depth: (ctx.trigger_path || []).length,
          }
        );

        // Once the trigger is done, we can save the event to the database
        cachedEvents.set(ctx.req_id, [
          ...((cachedEvents.get(ctx.req_id) || []) as Event[]),
          {
            doc_table: table,
            doc_action: action,
            doc_pk: pk,
          },
        ]);
      }
    }

    // When everything is done, let's call the websocket to notify the client
    if (rootTrigger) {
      // Get all modified entities
      const events: Event[] = cachedEvents.get(ctx.req_id) || [];

      this.socket.publishClient(ctx, ctx.client_id, "invalidated", [
        ..._.uniqBy(events, (a) =>
          [a.doc_action, a.doc_table, a.doc_pk?.id].join("")
        ).map((a) => _.pick(a, ["doc_table", "doc_action", "doc_pk"])),
        {
          doc_table: table,
          doc_action: action,
          doc_pk: pk,
        },
      ]);

      cachedEvents.del(ctx.req_id);
    }
  }
}
