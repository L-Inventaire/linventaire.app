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
import { addUsersToThread } from "../../comments/services/threads";
import Services from "#src/services/index";
import { NotificationsDefinition } from "../entities/notifications";
import { EventsDefinition } from "#src/services/system/entities/events";
import { getLabel } from "#src/services/rest/services/rest";

export const setupTriggerAssigned = async () => {
  // On any document, if we have a mention, add the user to the subscription list
  Framework.TriggersManager.registerTrigger<RestEntity>("*", {
    name: "Notify and update subscribed users (assigned changed)",
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
        !_.isEqual((entity as any)?.assigned, (old as any)?.assigned) &&
        !!entity
      );
    },
    callback: async (ctx, entity, _old, { table }) => {
      const assigned: string[] =
        typeof (entity as any).assigned === "string"
          ? [(entity as any).assigned]
          : (entity as any).assigned;

      if (assigned?.length) {
        await addUsersToThread(ctx, entity.client_id, table, entity.id, [
          ...assigned,
        ]);
      }

      const user = ctx.id
        ? await Services.Users.getUser(ctx, { id: ctx.id })
        : null;
      if (assigned?.length) {
        const assignedUser =
          assigned[0] !== ctx.id
            ? await Services.Users.getUser(ctx, {
                id: assigned[0],
              })
            : null;

        await Services.Notifications.notifyUsers(
          ctx,
          {
            client_id: entity.client_id,
            entity_id: entity.id,
            entity: table,
            entity_display_name: getLabel(table, entity),
            type: "assigned",
            metadata: {
              field: "assigned",
              by: user?.id,
              by_name: user?.full_name,
              by_email: user?.id_email,
              assigned: assignedUser?.id,
              assigned_name: assignedUser?.full_name,
              assigned_email: assignedUser?.id_email,
            },
          },
          assigned,
          { onlyThem: true }
        );
      }
    },
  });
};
