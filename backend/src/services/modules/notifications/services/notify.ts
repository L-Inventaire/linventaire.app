import platform from "#src/platform/index";
import Services from "#src/services/index";
import NotificationsType, {
  NotificationsDefinition,
} from "../entities/notifications";

export const createNotification = async (
  ctx: any,
  entity: Pick<
    NotificationsType,
    | "client_id"
    | "user_id"
    | "entity"
    | "entity_id"
    | "type"
    | "metadata"
    | "entity_display_name"
  >
): Promise<NotificationsType> => {
  if (
    !entity.client_id ||
    !entity.user_id ||
    !entity.entity ||
    !entity.entity_id ||
    !entity.type
  ) {
    throw new Error("Missing required fields");
  }

  // Updated existing notification if possible
  const db = await platform.Db.getService();
  const existing = await db.selectOne<NotificationsType>(
    ctx,
    NotificationsDefinition.name,
    {
      client_id: entity.client_id,
      user_id: entity.user_id,
      entity: entity.entity,
      entity_id: entity.entity_id,
    }
  );
  if (!existing) {
    return await Services.Rest.create(ctx, NotificationsDefinition.name, {
      ...entity,
      last_notified_at: new Date().getTime(),
      read: false,
    });
  } else {
    const also = [];
    if (!existing.read) {
      also.push({
        type: existing.type,
        metadata: existing.metadata,
      });
      also.push(...(existing.also || []));
    }
    return (await Services.Rest.update(
      ctx,
      NotificationsDefinition.name,
      {
        id: existing.id,
        user_id: entity.user_id,
        client_id: entity.client_id,
        entity: entity.entity,
        entity_id: entity.entity_id,
      },
      {
        ...entity,
        last_notified_at: new Date().getTime(),
        id: existing.id,
        also,
        read: false,
      }
    )) as unknown as NotificationsType;
  }
};

/**
 * Marks all notifications for a specific user and client as read
 * @param ctx - The context object
 * @param clientId - The client ID
 * @param userId - The user ID
 * @returns A promise that resolves when all notifications have been marked as read
 */
export const markAllNotificationsAsRead = async (
  ctx: any,
  clientId: string,
  userId: string
): Promise<void> => {
  if (!clientId || !userId) {
    throw new Error(
      "Missing required fields: clientId and userId are required"
    );
  }

  const db = await platform.Db.getService();

  // Update all unread notifications for this user in this client
  await db.update(
    ctx,
    NotificationsDefinition.name,
    {
      client_id: clientId,
      user_id: userId,
      read: false,
    },
    { read: true } as Partial<NotificationsType>
  );
};
