import { Express, Router } from "express";
import { default as Framework, default as platform } from "../../../platform";
import { Logger } from "../../../platform/logger-db";
import { InternalApplicationService } from "../../types";
import { TagsDefinition, Tags as TagsEntity } from "./entities/tags";
import _ from "lodash";

export default class Tags implements InternalApplicationService {
  version = 1;
  name = "tags";
  private logger: Logger;

  async init(server: Express) {
    const router = Router();
    server.use(`/api/${this.name}/v${this.version}`, router);

    const db = await platform.Db.getService();
    await db.createTable(TagsDefinition);

    this.logger = Framework.LoggerDb.get("tags");

    Framework.TriggersManager.registerEntities([TagsDefinition], {
      READ: "TAGS_READ",
      WRITE: "TAGS_WRITE",
      MANAGE: "TAGS_MANAGE",
    });

    // This trigger will add the tags to the "searchable" field on every modifications
    Framework.TriggersManager.registerTrigger("*", {
      name: "tags-update-searchable",
      priority: 1000, // Always do it after everything else
      test: (_ctx, newEntity, oldEntity, { table, depth }) => {
        return (
          depth === 0 &&
          (((newEntity as any)?.tags?.length &&
            !_.isEqual((newEntity as any)?.tags, (oldEntity as any)?.tags)) ||
            table === TagsDefinition.name)
        );
      },
      callback: async (ctx, newEntity, oldEntity, { table, depth }) => {
        const db = await platform.Db.getService();

        if (depth === 0) {
          if (table === TagsDefinition.name) {
            // In this case we must update all rest entities that have the tags
            const tag = newEntity as TagsEntity | null;
            if (
              tag &&
              oldEntity &&
              tag?.name !== (oldEntity as TagsEntity)?.name
            ) {
              const entities = Framework.TriggersManager.getEntities();
              for (const entity in entities) {
                const { name, columns, rest } = entities[entity];
                if (columns.tags && rest.searchable && columns.updated_at) {
                  // Find corresponding entities and update the searchable field
                  const entities = await db.select<{
                    id: string;
                    searchable: string;
                  }>(
                    { ...ctx, role: "SYSTEM" },
                    name,
                    {
                      where: "client_id = $1 AND $2 = ANY(tags)",
                      values: [ctx.client_id, tag.id],
                    },
                    {
                      // For now we limit to 1000 entities updated that way as it can quickly become a performance issue
                      limit: 1000,
                      index: "updated_at",
                      asc: false,
                    }
                  );

                  for (const entity of entities) {
                    await db.update<{ id: string; searchable: string }>(
                      ctx,
                      name,
                      {
                        id: entity.id,
                        client_id: ctx.client_id,
                      },
                      {
                        searchable: entity.searchable + " " + tag.name,
                      },
                      { triggers: false }
                    );
                  }
                }
              }
            }
          } else if (
            (newEntity as any)?.tags?.length &&
            !_.isEqual((newEntity as any)?.tags, (oldEntity as any)?.tags)
          ) {
            // Here we just need to check if tags list changed, and if yes, update the searchable field
            const tags = await db.select<TagsEntity>(ctx, TagsDefinition.name, {
              id: (newEntity as any).tags,
              client_id: ctx.client_id,
            });

            await db.update<{ searchable: string }>(
              ctx,
              table,
              {
                id: (newEntity as any).id,
                client_id: ctx.client_id,
              },
              {
                searchable:
                  (newEntity as any).searchable +
                  " " +
                  tags.map((tag) => tag.name).join(" "),
              },
              { triggers: false }
            );
          }
        }
      },
    });

    console.log(`${this.name}:v${this.version} initialized`);

    return this;
  }

  // Here will go the exported functions for other services
}
