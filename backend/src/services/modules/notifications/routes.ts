import platform from "#src/platform/index";
import { Ctx } from "#src/services/utils";
import { Router } from "express";
import _ from "lodash";
import { checkRole } from "../../common";
import {
  NotificationsPreferences,
  NotificationsPreferencesDefinition,
} from "./entities/preferences";
import { markAllNotificationsAsRead } from "./services/notify";

export default (router: Router) => {
  router.get("/:clientId/preferences", checkRole("USER"), async (req, res) => {
    // Ensure a notification preferences object exists for the user
    const db = await platform.Db.getService();
    const ctx = Ctx.get(req)?.context;
    let existing = await db.selectOne<NotificationsPreferences>(
      ctx,
      NotificationsPreferencesDefinition.name,
      {
        client_id: req.params.clientId,
        user_id: ctx.id,
        id: ctx.id,
        is_deleted: false,
      }
    );

    if (!existing) {
      existing = {
        id: ctx.id,
        client_id: req.params.clientId,
        user_id: ctx.id,
        always_notified: [],
        is_deleted: false,
      } as NotificationsPreferences;
      await db.insert(
        ctx,
        NotificationsPreferencesDefinition.name,
        existing as NotificationsPreferences
      );
    }

    res.send(existing);
  });

  router.post("/:clientId/preferences", checkRole("USER"), async (req, res) => {
    // Set a notification preferences object exists for the user
    const db = await platform.Db.getService();
    const ctx = Ctx.get(req)?.context;

    await db.update<NotificationsPreferences>(
      ctx,
      NotificationsPreferencesDefinition.name,
      {
        client_id: req.params.clientId,
        user_id: ctx.id,
      },
      _.pick(req.body as NotificationsPreferences, "always_notified")
    );

    const updated = await db.selectOne<NotificationsPreferences>(
      ctx,
      NotificationsPreferencesDefinition.name,
      {
        client_id: req.params.clientId,
        user_id: ctx.id,
        id: ctx.id,
        is_deleted: false,
      }
    );

    res.send(updated);
  });

  router.post("/:clientId/read_all", checkRole("USER"), async (req, res) => {
    const ctx = Ctx.get(req)?.context;

    // Mark all notifications as read for this user and client
    await markAllNotificationsAsRead(ctx, req.params.clientId, ctx.id);

    res.send({ success: true });
  });
};
