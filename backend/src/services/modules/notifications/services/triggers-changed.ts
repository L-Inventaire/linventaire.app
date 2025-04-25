import { ClientsDefinition } from "#src/services/clients/entities/clients";
import { ClientsUsersDefinition } from "#src/services/clients/entities/clients-users";
import { RestEntity } from "#src/services/rest/entities/entity";
import { UsersDefinition } from "#src/services/users/entities/users";
import _ from "lodash";
import { default as Framework } from "../../../../platform";
import { CommentsDefinition } from "../../comments/entities/comments";
import { ThreadsDefinition } from "../../comments/entities/threads";
import { FilesDefinition } from "../../files/entities/files";
import { TagsDefinition } from "../../tags/entities/tags";
import Services from "#src/services/index";
import { NotificationsDefinition } from "../entities/notifications";
import { EventsDefinition } from "#src/services/system/entities/events";
import { getLabel } from "#src/services/rest/services/rest";

export const setupTriggerModified = async () => {
  // On any document, if we have a mention, add the user to the subscription list
  Framework.TriggersManager.registerTrigger<RestEntity>("*", {
    name: "Notify and update subscribed users (any change)",
    test: (_ctx, entity, old, meta) => {
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
        // For now we'll do it only in cas of change of state
        !!entity &&
        !_.isEqual((entity as any)?.state, (old as any)?.state)
      );
    },
    callback: async (ctx, entity, _old, { table }) => {
      if (ctx.id) {
        // Notify assigned users AND users in the thread
        const user = await Services.Users.getUser(ctx, { id: ctx.id });
        await Services.Notifications.notifyUsers(ctx, {
          client_id: entity.client_id,
          entity_id: entity.id,
          entity: table,
          entity_display_name: getLabel(table, entity),
          type: "modified",
          metadata: {
            field: "state",
            by: user?.id,
            by_name: user?.full_name,
            by_email: user?.id_email,
          },
        });
      }
    },
  });
};
