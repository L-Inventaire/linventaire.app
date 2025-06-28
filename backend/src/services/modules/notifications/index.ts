import Services from "#src/services/index";
import { Context } from "#src/types";
import { Express, Router } from "express";
import _ from "lodash";
import NodeCache from "node-cache";
import { default as Framework, default as platform } from "../../../platform";
import { Logger } from "../../../platform/logger-db";
import { InternalApplicationService } from "../../types";
import NotificationsType, {
  NotificationsDefinition,
} from "./entities/notifications";
import {
  NotificationsGroupedEmails,
  NotificationsGroupedEmailsDefinition,
} from "./entities/notifications-grouped-email";
import {
  NotificationsPreferences,
  NotificationsPreferencesDefinition,
} from "./entities/preferences";
import registerRoutes from "./routes";
import { setupCronEmailNotifications } from "./services/email-cron";
import { createNotification } from "./services/notify";
import { setupTriggerAssigned } from "./services/triggers-assigned";
import { setupTriggerModified } from "./services/triggers-changed";

const usersPreferencesCache = new NodeCache({ stdTTL: 60 });

export default class Notifications implements InternalApplicationService {
  version = 1;
  name = "notifications";
  private logger: Logger;

  async init(server: Express) {
    const router = Router();
    server.use(`/api/${this.name}/v${this.version}`, router);
    registerRoutes(router);

    const db = await platform.Db.getService();
    await db.createTable(NotificationsDefinition);
    await db.createTable(NotificationsPreferencesDefinition);
    await db.createTable(NotificationsGroupedEmailsDefinition);

    this.logger = Framework.LoggerDb.get("notifications");

    Framework.TriggersManager.registerEntities<NotificationsType>(
      [NotificationsDefinition],
      async (ctx, entity) => {
        if (_.isArray(entity)) {
          return entity.some(
            (e) =>
              e.key === "user_id" &&
              !e.not &&
              e.values.length === 1 &&
              e.values[0].op === "equals" &&
              e.values[0].value === ctx.id
          );
        } else {
          return entity?.user_id === ctx.id;
        }
      }
    );

    Framework.TriggersManager.registerTrigger<NotificationsType>(
      NotificationsDefinition,
      {
        callback: async (ctx, entity, oldEntity) => {
          if (!oldEntity) {
            // Add it to the grouped notifications email system
            const db = await platform.Db.getService();
            const currentGrouped =
              await db.selectOne<NotificationsGroupedEmails>(
                ctx,
                NotificationsGroupedEmailsDefinition.name,
                {
                  client_id: ctx.client_id,
                  user_id: entity.user_id,
                }
              );
            if (!currentGrouped) {
              await db.insert<NotificationsGroupedEmails>(
                ctx,
                NotificationsGroupedEmailsDefinition.name,
                {
                  created_at: new Date(),
                  client_id: ctx.client_id,
                  user_id: entity.user_id,
                  notifications: [entity.id],
                }
              );
            } else {
              currentGrouped.notifications.push(entity.id);
              await db.update<NotificationsGroupedEmails>(
                ctx,
                NotificationsGroupedEmailsDefinition.name,
                {
                  client_id: ctx.client_id,
                  user_id: entity.user_id,
                },
                {
                  notifications: currentGrouped.notifications,
                }
              );
            }
          }
          if (oldEntity?.read !== entity?.read && entity?.read) {
            // Remove email from grouped notifications email
            const db = await platform.Db.getService();
            await db.delete(ctx, NotificationsGroupedEmailsDefinition.name, {
              client_id: ctx.client_id,
              user_id: entity.user_id,
            });
          }
        },
        name: "Add notification to grouped notifications email",
      }
    );

    await setupCronEmailNotifications();
    await setupTriggerAssigned();
    await setupTriggerModified();

    console.log(`${this.name}:v${this.version} initialized`);

    return this;
  }

  // Lookup for all users that should be notified and notify them
  notifyUsers = async (
    ctx: Context,
    entity: Pick<
      NotificationsType,
      | "client_id"
      | "entity"
      | "entity_id"
      | "type"
      | "metadata"
      | "entity_display_name"
    >,
    users: string[] = [],
    { onlyThem = false }: { onlyThem?: boolean } = {}
  ): Promise<void> => {
    if (!ctx.client_id) {
      throw new Error("Missing a client_id in ctx");
    }

    this.logger.info(
      ctx,
      `Notifying users of ${entity.type} for ${entity.entity} ${entity.entity_id}`
    );

    let companyUsers: { [key: string]: NotificationsPreferences } =
      usersPreferencesCache.get(entity.client_id);
    if (!companyUsers) {
      companyUsers = {};
      const db = await platform.Db.getService();
      const users = await Services.Clients.getClientUsers(
        { ...ctx, role: "SYSTEM" },
        entity.client_id
      );
      for (const user of users) {
        companyUsers[user.user_id] = {} as any;
        const preferences = await db.selectOne<NotificationsPreferences>(
          ctx,
          NotificationsPreferencesDefinition.name,
          {
            client_id: entity.client_id,
            user_id: user.user_id,
          }
        );
        if (preferences) companyUsers[user.user_id] = preferences;
      }
      usersPreferencesCache.set(entity.client_id, companyUsers);
    }

    const entityUsers = onlyThem
      ? users
      : (
          await Services.Comments.getThread(
            { ...ctx, role: "SYSTEM" },
            entity.client_id,
            entity.entity_id
          )
        )?.subscribers || [];

    const usersToNotify = _.uniq([
      ...entityUsers,
      ...users,
      ...(onlyThem
        ? []
        : Object.entries(companyUsers)
            .filter(([_key, val]) =>
              (val?.always_notified || []).includes(entity.type)
            )
            .map(([key]) => key)),
    ]).filter(Boolean);

    this.logger.info(
      ctx,
      `Users to notify: entity=${entityUsers.join(", ")}, users=${users.join(
        ", "
      )}, company=${Object.keys(companyUsers).join(
        ", "
      )} final=${usersToNotify.join(", ")}`
    );

    for (const user of usersToNotify) {
      if (user !== ctx.id) {
        try {
          await createNotification(
            { ...ctx, role: "SYSTEM" },
            {
              ...entity,
              user_id: user,
            }
          );
        } catch (e) {
          console.error(e);
          throw e;
        }
      }
    }
  };
}
