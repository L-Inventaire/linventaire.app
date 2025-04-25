import { Express, Router } from "express";
import { default as Framework, default as platform } from "../../../platform";
import { Logger } from "../../../platform/logger-db";
import { InternalApplicationService } from "../../types";
import CommentsType, { CommentsDefinition } from "./entities/comments";
import Threads, { ThreadsDefinition } from "./entities/threads";
import registerRoutes from "./routes";
import { setupCreateComment } from "./services/trigger-create";
import { setupTriggerMentions } from "./services/triggers-mentions";
import Services from "#src/services/index";
import { getLabel } from "#src/services/rest/services/rest";

export default class Comments implements InternalApplicationService {
  version = 1;
  name = "comments";
  private logger: Logger;

  async init(server: Express) {
    const router = Router();
    registerRoutes(router);
    server.use(`/api/${this.name}/v${this.version}`, router);
    this.logger = Framework.LoggerDb.get("comments");

    const db = await platform.Db.getService();
    await db.createTable(CommentsDefinition);
    await db.createTable(ThreadsDefinition);

    Framework.TriggersManager.registerEntities(
      [CommentsDefinition, ThreadsDefinition],
      {
        READ: "COMMENTS_READ",
        WRITE: "COMMENTS_WRITE",
        MANAGE: "COMMENTS_MANAGE",
      }
    );

    await setupTriggerMentions();
    await setupCreateComment();

    console.log(`${this.name}:v${this.version} initialized`);

    return this;
  }

  // Here will go the exported functions for other services
  createEvent = async (
    ctx: any,
    entity: Pick<
      CommentsType,
      "content" | "client_id" | "item_entity" | "item_id" | "metadata"
    > &
      Partial<CommentsType>
  ) => {
    entity.type = "event";
    entity.reactions = entity.reactions || [];
    entity.documents = entity.documents || [];

    if (entity.metadata?.event_type) {
      const db = await platform.Db.getService();
      const originalEntity = await db.selectOne(ctx, entity.item_entity, {
        client_id: entity.client_id,
        id: entity.item_id,
      });
      await Services.Notifications.notifyUsers(
        { ...ctx, client_id: entity.client_id, id: "system", role: "SYSTEM" },
        {
          client_id: entity.client_id,
          entity: entity.item_entity,
          entity_id: entity.item_id,
          entity_display_name: getLabel(entity.item_entity, originalEntity),
          type: entity.metadata.event_type,
          metadata: {
            ...entity.metadata,
          },
        }
      );
    }

    return await Services.Rest.create(
      { ...ctx, client_id: entity.client_id, id: "system", role: "SYSTEM" },
      CommentsDefinition.name,
      entity
    );
  };

  createComment = async (ctx: any, entity: CommentsType) => {
    return await this.createEvent(ctx, entity);
  };

  getThread = async (ctx: any, client_id: string, item_id: string) => {
    const db = await platform.Db.getService();
    return await db.selectOne<Threads>(ctx, ThreadsDefinition.name, {
      client_id,
      item_id,
    });
  };
}
