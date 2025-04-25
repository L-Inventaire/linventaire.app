import Services from "#src/services/index";
import { buildQueryFromMap } from "#src/services/rest/services/utils";
import { Context } from "#src/types";
import config from "config";
import _ from "lodash";
import {
  default as Framework,
  default as platform,
} from "../../../../platform";
import { getInvoiceLogoHtml } from "../../invoices/utils";
import Notifications, {
  NotificationsDefinition,
} from "../entities/notifications";
import {
  NotificationsGroupedEmails,
  NotificationsGroupedEmailsDefinition,
} from "../entities/notifications-grouped-email";
import { captureException } from "@sentry/node";
import { EmailAttachment } from "#src/platform/push-email";

export const setupCronEmailNotifications = async () => {
  Framework.Cron.schedule(
    "grouped_notifications_email",
    "*/5 * * * *", // Every 5 minutes, send grouped notifications by email
    async (ctx) => {
      const db = await platform.Db.getService();
      const notifications = await db.select<NotificationsGroupedEmails>(
        ctx,
        NotificationsGroupedEmailsDefinition.name,
        {},
        { limit: 100 }
      );
      for (const group of notifications) {
        try {
          const user = await Services.Users.getUser(ctx, {
            id: group.user_id,
          });
          if (!user) throw new Error("User not found");
          const client = await Services.Clients.getClient(ctx, group.client_id);
          if (!client) throw new Error("Client not found");

          ctx.lang = user.preferences?.language || "fr";

          const notifications = await Services.Rest.search<Notifications>(
            { ...ctx, client_id: group.client_id },
            NotificationsDefinition.name,
            buildQueryFromMap({ id: group.notifications }),
            { limit: group.notifications.length }
          );

          let subject = Framework.I18n.t(ctx, "emails.notifications.subject", {
            replacements: {
              company: client?.company?.name || client?.company?.legal_name,
              count: group.notifications.length.toString(),
            },
          });

          if (notifications?.list.length === 1) {
            subject =
              getNotificationTitle(ctx, notifications.list[0]) +
              " - " +
              subject;
          }

          const message = Framework.I18n.t(
            ctx,
            "emails.notifications.message",
            {
              replacements: {
                company: client?.company?.name || client?.company?.legal_name,
                count: group.notifications.length.toString(),
                link:
                  config.get<string>("server.domain").replace(/\/$/, "") +
                  `/${client?.id}/notifications`,
                content: await buildNotificationsContent(
                  ctx,
                  notifications?.list
                ),
              },
            }
          );

          const attachments: EmailAttachment[] = [];
          for (const notification of (notifications?.list || []).filter(
            (a) => a.type === "quote_signed"
          )) {
            // Add signed document to the email
            const document =
              await Services.SignatureSessions.downloadSignedDocument(
                ctx,
                notification.entity_id
              );
            attachments.push({
              filename:
                (notification.entity_display_name || "document").replace(
                  / +/gm,
                  "_"
                ) + ".pdf",
              content: document,
            });
          }

          await Framework.PushEMail.push(
            ctx,
            user.id_email,
            message,
            {
              from: client?.company?.name || client?.company?.legal_name,
              subject,
              logo: await getInvoiceLogoHtml(ctx, client.invoices.logo),
              attachments,
            },
            client.smtp
          );
        } catch (e) {
          captureException(e);
          console.error(e);
        } finally {
          await db.delete<NotificationsGroupedEmails>(
            ctx,
            NotificationsGroupedEmailsDefinition.name,
            {
              client_id: group.client_id,
              user_id: group.user_id,
            }
          );
        }
      }
    }
  );
};

const getNotificationTitle = (ctx: Context, n: Notifications) => {
  return Framework.I18n.t(
    ctx,
    [`notifications.entities_names.${n.entity}`, n.entity],
    {
      replacements: {
        name: n.entity_display_name?.replace(/<[^>]*>?/gm, " "),
      },
    }
  );
};

// Build an HTML notifications summary
const buildNotificationsContent = async (
  ctx: Context,
  notifications: Notifications[]
) => {
  const parentStyles =
    "background: #fffff;border: 1px solid #eaebed;border-radius: 5px;";
  const notificationStyles =
    "padding: 6px 8px; border-bottom: 1px solid #eaebed";
  const titleStyles = "font-weight: bold; font-size: 13px";
  const contentStyles = "font-size: 13px; opacity: 0.7";

  return (
    `<div style="${parentStyles}">` +
    (notifications || [])
      .map((n) => {
        const events = _.uniqBy(
          [{ type: n.type, metadata: n.metadata }, ...(n.also || [])],
          "type"
        );
        const title = getNotificationTitle(ctx, n);

        return `<div style="${notificationStyles}">
      <div style="${titleStyles}">${title}</div>
      <div style="${contentStyles}">${(events || [])
          .map((also) =>
            Framework.I18n.t(
              ctx,
              [
                `notifications.${also.type}.title`,
                `notifications.${also.type}.title`,
                also.type,
              ],
              {
                replacements: {
                  ...((also.metadata || {}) as any),
                },
              }
            )
          )
          .join("")}</div>
    </div>`;
      })
      .join("") +
    `</div>`
  );
};
