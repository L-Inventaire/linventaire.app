import Framework from "#src/platform/index";
import { ClientsDefinition } from "#src/services/clients/entities/clients";
import { ClientsUsersDefinition } from "#src/services/clients/entities/clients-users";
import { RestEntity } from "#src/services/rest/entities/entity";
import { insertIntoHistory } from "#src/services/rest/services/history";
import { UsersDefinition } from "#src/services/users/entities/users";
import _ from "lodash";
import { FilesDefinition } from "../../files/entities/files";
import { TagsDefinition } from "../../tags/entities/tags";
import Comments, { CommentsDefinition } from "../entities/comments";
import { ThreadsDefinition } from "../entities/threads";
import { addUsersToThread } from "./threads";
import { NotificationsDefinition } from "../../notifications/entities/notifications";
import { EventsDefinition } from "#src/services/system/entities/events";

export const setupCreateComment = async () => {
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
        ].includes(meta.table) && !_old
      );
    },
    callback: async (ctx, entity, oldEntity, { table }) => {
      // Make sure thread exists
      await addUsersToThread(ctx, entity.client_id, table, entity.id, []);
    },
  });

  Framework.TriggersManager.registerTrigger<Comments>(CommentsDefinition, {
    name: "create-comment",
    callback: async (ctx, entity, oldEntity) => {
      if (ctx?.role !== "SYSTEM") {
        if (
          (entity && ctx?.id !== entity?.created_by) ||
          (oldEntity && ctx?.id !== oldEntity?.created_by) ||
          (entity || oldEntity)?.type !== "comment"
        ) {
          throw new Error("You can't modify a comment that you don't own");
        }
        const newReactions = _.uniq(
          entity?.reactions?.reduce(
            (acc, reaction) => acc.concat(reaction.users),
            [] as string[]
          )
        )?.filter((a) => a !== ctx.id);
        const previousReactions = _.uniq(
          oldEntity?.reactions?.reduce(
            (acc, reaction) => acc.concat(reaction.users),
            [] as string[]
          )
        )?.filter((a) => a !== ctx.id);
        if (newReactions?.length !== previousReactions?.length) {
          throw new Error("You can't modify reactions that you don't own");
        }
      }

      // Now we can create the comment and add a revision to the corresponding entity
      const db = await Framework.Db.getService();
      const item = await db.selectOne<RestEntity>(ctx, entity.item_entity, {
        client_id: ctx.client_id,
        id: entity.item_id,
      });
      if (!item) {
        throw new Error("Item not found or you don't have access to it");
      }

      const oldRestEntity = await db.selectOne<RestEntity>(
        ctx,
        entity.item_entity,
        {
          client_id: ctx.client_id,
          id: entity.item_id,
        }
      );

      await db.update<RestEntity>(
        ctx,
        entity.item_entity,
        {
          id: entity.item_id,
        },
        {
          comment_id: entity.id,
        },
        {
          triggers: true,
        }
      );

      // TODO: Remove scotch. REASON: because the history is not being triggered by the update above
      await insertIntoHistory(
        ctx,
        entity.item_entity,
        { ...oldRestEntity, comment_id: entity.id },
        oldRestEntity
      );
    },
  });
};
