import Framework from "#src/platform/index";
import Notifications, {
  NotificationsDefinition,
} from "#src/services/modules/notifications/entities/notifications";
import { expandSearchable } from "#src/services/rest/services/rest";
import { Context } from "#src/types";

export const fixNotificationsSearchables = async (ctx: Context) => {
  // For all notifications
  const db = await Framework.Db.getService();
  let notifications = [];
  let offset = 0;
  do {
    notifications = await db.select<Notifications>(
      ctx,
      NotificationsDefinition.name,
      {},
      {
        offset,
        limit: 1000,
        index: "id",
      }
    );

    for (const entity of notifications) {
      entity.searchable = expandSearchable(
        Framework.TriggersManager.getEntities()[
          NotificationsDefinition.name
        ].rest.searchable(entity)
      );
      await db.update<Notifications>(
        ctx,
        NotificationsDefinition.name,
        { id: entity.id, user_id: entity.user_id },
        {
          searchable: entity.search,
        },
        { triggers: false }
      );
    }

    offset += notifications.length;
  } while (notifications.length > 0);
};
