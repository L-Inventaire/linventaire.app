import { ClientsDefinition } from "#src/services/clients/entities/clients";
import { ClientsUsersDefinition } from "#src/services/clients/entities/clients-users";
import Services from "#src/services/index";
import { RestEntity } from "#src/services/rest/entities/entity";
import { UsersDefinition } from "#src/services/users/entities/users";
import _ from "lodash";
import platform, { default as Framework } from "../../../../platform";
import { FilesDefinition } from "../../files/entities/files";
import { NotificationsDefinition } from "../../notifications/entities/notifications";
import { TagsDefinition } from "../../tags/entities/tags";
import CommentsType, { CommentsDefinition } from "../entities/comments";
import { ThreadsDefinition } from "../entities/threads";
import { addUsersToThread, clearThread } from "../services/threads";
import { EventsDefinition } from "#src/services/system/entities/events";
import { getLabel } from "#src/services/rest/services/rest";

export const setupTriggerMentions = async () => {
  // On any document, if we have a mention, add the user to the subscription list
  Framework.TriggersManager.registerTrigger<RestEntity>("*", {
    name: "Notify and update subscribed users (mention anywhere in the document)",
    test: (_ctx, entity, _old, meta) => {
      return (
        ![
          UsersDefinition.name,
          ClientsDefinition.name,
          ClientsUsersDefinition.name,
          TagsDefinition.name,
          FilesDefinition.name,
          ThreadsDefinition.name,
          CommentsDefinition.name,
          NotificationsDefinition.name,
          EventsDefinition.name,
        ].includes(meta.table) &&
        (!entity || !!JSON.stringify(entity)?.match(/mention:[a-zA-Z0-9-]+/g))
      );
    },
    callback: async (ctx, entity, oldEntity, { table }) => {
      if (!entity) {
        // Remove all subscriptions as the document is deleted
        await clearThread(ctx, oldEntity.client_id, table, oldEntity.id);
      }

      // Search for mentions in both entities
      const mentions =
        JSON.stringify(entity || {}).match(/mention:[a-zA-Z0-9-]+/g) || [];
      const oldMentions =
        JSON.stringify(oldEntity || {}).match(/mention:[a-zA-Z0-9-]+/g) || [];
      const newMentions = _.difference(mentions, oldMentions);
      if (newMentions.length > 0) {
        const userEntity = await Services.Users.getUser(ctx, {
          id: ctx.id,
        });

        const users = newMentions.map((m) => m.replace("mention:", ""));
        await addUsersToThread(ctx, entity.client_id, table, entity.id, users);

        for (const user of users) {
          // Now notify subscribers
          if (user === ctx.id) continue;
          await Services.Notifications.notifyUsers(
            ctx,
            {
              client_id: entity.client_id,
              entity: table,
              entity_id: entity.id,
              entity_display_name: getLabel(table, entity),
              type: "mentioned",
              metadata: {
                by: ctx.id,
                by_name: userEntity.full_name,
                by_email: userEntity.id_email,
              },
            },
            [user]
          );
        }
      }
    },
  });

  Framework.TriggersManager.registerTrigger<CommentsType>(CommentsDefinition, {
    name: "Notify and update subscribed users (mentions in comments)",
    test: (_ctx, entity, old) => {
      return (
        !!entity?.content?.match(/mention:[a-zA-Z0-9-]+/g) || (entity && !old)
      );
    },
    callback: async (ctx, entity, oldEntity) => {
      if (entity?.content?.match(/mention:[a-zA-Z0-9-]+/g)) {
        // Search for mentions in both entities
        const mentions = entity.content.match(/mention:[a-zA-Z0-9-]+/g) || [];
        const oldMentions =
          oldEntity?.content.match(/mention:[a-zA-Z0-9-]+/g) || [];
        const newMentions = _.difference(mentions, oldMentions);
        if (newMentions.length > 0) {
          const userEntity = await Services.Users.getUser(ctx, {
            id: ctx.id,
          });

          const users = newMentions.map((m) => m.replace("mention:", ""));
          await addUsersToThread(
            ctx,
            entity.client_id,
            entity.item_entity,
            entity.item_id,
            users
          );

          const db = await platform.Db.getService();
          const originalEntity = await db.selectOne<RestEntity>(
            ctx,
            entity.item_entity,
            {
              client_id: entity.client_id,
              id: entity.item_id,
            }
          );

          for (const user of users) {
            // Now notify subscribers
            if (user === ctx.id) continue;
            await Services.Notifications.notifyUsers(
              ctx,
              {
                client_id: entity.client_id,
                entity: entity.item_entity,
                entity_id: entity.item_id,
                entity_display_name: getLabel(
                  entity.item_entity,
                  originalEntity
                ),
                type: "mentioned",
                metadata: {
                  by: ctx.id,
                  by_name: userEntity.full_name,
                  by_email: userEntity.id_email,
                },
              },
              [user]
            );
          }
        }
      }

      const db = await platform.Db.getService();
      const originalEntity = await db.selectOne<RestEntity>(
        ctx,
        entity.item_entity,
        {
          client_id: entity.client_id,
          id: entity.item_id,
        }
      );

      // Comment was created, notify the thread
      if (!oldEntity && entity.type === "comment") {
        const user = await Services.Users.getUser(ctx, { id: ctx.id });
        await Services.Notifications.notifyUsers(ctx, {
          client_id: entity.client_id,
          entity: entity.item_entity,
          entity_id: entity.item_id,
          type: "commented",
          entity_display_name: getLabel(entity.item_entity, originalEntity),
          metadata: {
            by: user.id,
            by_name: user.full_name,
            by_email: user.id_email,
            content: entity.content,
          },
        });
      }
    },
  });
};
