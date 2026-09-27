import { Request, Router } from "express";
import _ from "lodash";
import { ForbiddenError, NotFoundError } from "../../types";
import Services from "..";
import { checkClientRoles, checkRole, denyApiKeys } from "../common";
import { Ctx } from "../utils";
import { createApiKey, listApiKeys, revokeApiKey } from "./services/api-keys";
import {
  getApiCall,
  getApiCallsStats,
  listApiCalls,
} from "./services/api-calls";
import {
  deleteWebhookDeliveries,
  getDelivery,
  listDeliveries,
  retryDelivery,
  sendTestDelivery,
} from "./services/webhook-deliveries";
import {
  createWebhook,
  deleteWebhook,
  getWebhook,
  listWebhooks,
  rotateWebhookSecret,
  updateWebhook,
} from "./services/webhooks";

const isManager = async (req: Request) =>
  await Services.Clients.checkUserRoles(
    Ctx.get(req)!.context,
    req.params.clientId,
    ["CLIENT_MANAGE"]
  );

// "?all=1" lists the documents of every user, only for company managers
const wantsAll = async (req: Request) => {
  const all = req.query.all === "1" || req.query.all === "true";
  if (all && !(await isManager(req))) {
    throw ForbiddenError("You don't have the required roles");
  }
  return all;
};

export default (router: Router) => {
  router.get("/status", (req, res) => {
    res.json("ok");
  });

  // Tells who is behind the current credentials, handy to check an api key works
  router.get(
    "/:clientId/whoami",
    checkRole("USER"),
    checkClientRoles([]),
    async (req, res) => {
      const ctx = Ctx.get(req)!.context;
      const user = await Services.Users.getPublicUser(ctx, { id: ctx.id });
      const clients = await Services.Clients.getUserClients(ctx);
      const client = clients.find((c) => c.client_id === req.params.clientId);
      res.json({
        user,
        client_id: req.params.clientId,
        client_name:
          client?.client?.company?.name ||
          client?.client?.company?.legal_name ||
          "",
        roles: client?.roles?.list || [],
        authentication: ctx.role === "API" ? "api_key" : "session",
        api_key_id: ctx.api_key?.id || null,
      });
    }
  );

  // Api keys management must be done by the user itself, never with an api key.
  // Creating a key requires the API_ACCESS permission, listing and revoking don't
  // so users who lost the permission can still clean up their keys.
  router.get(
    "/:clientId/api-keys",
    checkRole("USER"),
    denyApiKeys(),
    checkClientRoles([]),
    async (req, res) => {
      const ctx = Ctx.get(req)!.context;
      const all = req.query.all === "1" || req.query.all === "true";
      if (
        all &&
        !(await Services.Clients.checkUserRoles(ctx, req.params.clientId, [
          "CLIENT_MANAGE",
        ]))
      ) {
        throw ForbiddenError("You don't have the required roles");
      }
      res.json(await listApiKeys(ctx, req.params.clientId, { all }));
    }
  );

  router.post(
    "/:clientId/api-keys",
    checkRole("USER"),
    denyApiKeys(),
    checkClientRoles(["API_ACCESS"]),
    async (req, res) => {
      const ctx = Ctx.get(req)!.context;
      res.json(await createApiKey(ctx, req.params.clientId, req.body));
    }
  );

  // Users can revoke their own keys, company managers can revoke any key
  router.delete(
    "/:clientId/api-keys/:id",
    checkRole("USER"),
    denyApiKeys(),
    checkClientRoles([]),
    async (req, res) => {
      const ctx = Ctx.get(req)!.context;
      const isManager = await Services.Clients.checkUserRoles(
        ctx,
        req.params.clientId,
        ["CLIENT_MANAGE"]
      );
      res.json(
        await revokeApiKey(ctx, req.params.clientId, req.params.id, {
          any_user: isManager,
        })
      );
    }
  );

  /**
   * Webhooks (API_ACCESS permission required): they can also be managed with an
   * api key, so integrations can subscribe to changes by themselves. Company
   * managers can manage every webhook.
   */
  router.get(
    "/:clientId/webhooks",
    checkRole("USER"),
    checkClientRoles(["API_ACCESS"]),
    async (req, res) => {
      const ctx = Ctx.get(req)!.context;
      res.json(
        await listWebhooks(ctx, req.params.clientId, {
          all: await wantsAll(req),
        })
      );
    }
  );

  router.post(
    "/:clientId/webhooks",
    checkRole("USER"),
    checkClientRoles(["API_ACCESS"]),
    async (req, res) => {
      const ctx = Ctx.get(req)!.context;
      res.json(await createWebhook(ctx, req.params.clientId, req.body || {}));
    }
  );

  router.get(
    "/:clientId/webhooks/:id",
    checkRole("USER"),
    checkClientRoles(["API_ACCESS"]),
    async (req, res) => {
      const ctx = Ctx.get(req)!.context;
      const webhook = await getWebhook(
        ctx,
        req.params.clientId,
        req.params.id,
        {
          any_user: await isManager(req),
        }
      );
      res.json(_.omit(webhook, ["secret", "operation", "operation_timestamp"]));
    }
  );

  router.put(
    "/:clientId/webhooks/:id",
    checkRole("USER"),
    checkClientRoles(["API_ACCESS"]),
    async (req, res) => {
      const ctx = Ctx.get(req)!.context;
      res.json(
        await updateWebhook(
          ctx,
          req.params.clientId,
          req.params.id,
          req.body || {},
          { any_user: await isManager(req) }
        )
      );
    }
  );

  router.delete(
    "/:clientId/webhooks/:id",
    checkRole("USER"),
    checkClientRoles(["API_ACCESS"]),
    async (req, res) => {
      const ctx = Ctx.get(req)!.context;
      await deleteWebhook(ctx, req.params.clientId, req.params.id, {
        any_user: await isManager(req),
      });
      await deleteWebhookDeliveries(req.params.id);
      res.json(true);
    }
  );

  router.post(
    "/:clientId/webhooks/:id/rotate-secret",
    checkRole("USER"),
    checkClientRoles(["API_ACCESS"]),
    async (req, res) => {
      const ctx = Ctx.get(req)!.context;
      res.json(
        await rotateWebhookSecret(ctx, req.params.clientId, req.params.id, {
          any_user: await isManager(req),
        })
      );
    }
  );

  router.post(
    "/:clientId/webhooks/:id/test",
    checkRole("USER"),
    checkClientRoles(["API_ACCESS"]),
    async (req, res) => {
      const ctx = Ctx.get(req)!.context;
      const webhook = await getWebhook(
        ctx,
        req.params.clientId,
        req.params.id,
        {
          any_user: await isManager(req),
        }
      );
      res.json(await sendTestDelivery(webhook));
    }
  );

  // Deliveries history: status, response and number of attempts
  router.get(
    "/:clientId/webhooks/:id/deliveries",
    checkRole("USER"),
    checkClientRoles(["API_ACCESS"]),
    async (req, res) => {
      const ctx = Ctx.get(req)!.context;
      const webhook = await getWebhook(
        ctx,
        req.params.clientId,
        req.params.id,
        {
          any_user: await isManager(req),
        }
      );
      res.json(
        await listDeliveries(req.params.clientId, webhook.id, {
          status: req.query.status as string,
          limit: parseInt(`${req.query.limit || 50}`),
          offset: parseInt(`${req.query.offset || 0}`),
        })
      );
    }
  );

  router.get(
    "/:clientId/webhooks/:id/deliveries/:deliveryId",
    checkRole("USER"),
    checkClientRoles(["API_ACCESS"]),
    async (req, res) => {
      const ctx = Ctx.get(req)!.context;
      const webhook = await getWebhook(
        ctx,
        req.params.clientId,
        req.params.id,
        {
          any_user: await isManager(req),
        }
      );
      const delivery = await getDelivery(
        req.params.clientId,
        req.params.deliveryId
      );
      if (delivery.webhook_id !== webhook.id) {
        throw NotFoundError("Delivery not found");
      }
      res.json(delivery);
    }
  );

  router.post(
    "/:clientId/webhooks/:id/deliveries/:deliveryId/retry",
    checkRole("USER"),
    checkClientRoles(["API_ACCESS"]),
    async (req, res) => {
      const ctx = Ctx.get(req)!.context;
      const webhook = await getWebhook(
        ctx,
        req.params.clientId,
        req.params.id,
        {
          any_user: await isManager(req),
        }
      );
      const delivery = await getDelivery(
        req.params.clientId,
        req.params.deliveryId
      );
      if (delivery.webhook_id !== webhook.id) {
        throw NotFoundError("Delivery not found");
      }
      res.json(await retryDelivery(delivery));
    }
  );

  /**
   * History of the calls made with api keys, users see the calls of their own keys
   * and company managers every call ("?all=1").
   */
  router.get(
    "/:clientId/api-calls",
    checkRole("USER"),
    denyApiKeys(),
    checkClientRoles([]),
    async (req, res) => {
      const ctx = Ctx.get(req)!.context;
      const all = await wantsAll(req);
      res.json(
        await listApiCalls(
          req.params.clientId,
          {
            user_id: all ? undefined : ctx.id,
            api_key_id: (req.query.api_key_id as string) || undefined,
            status: req.query.status as any,
          },
          {
            limit: parseInt(`${req.query.limit || 50}`),
            offset: parseInt(`${req.query.offset || 0}`),
          }
        )
      );
    }
  );

  router.get(
    "/:clientId/api-calls/stats",
    checkRole("USER"),
    denyApiKeys(),
    checkClientRoles([]),
    async (req, res) => {
      const ctx = Ctx.get(req)!.context;
      const all = await wantsAll(req);
      res.json(
        await getApiCallsStats(
          req.params.clientId,
          {
            user_id: all ? undefined : ctx.id,
            api_key_id: (req.query.api_key_id as string) || undefined,
          },
          parseInt(`${req.query.days || 30}`)
        )
      );
    }
  );

  router.get(
    "/:clientId/api-calls/:id",
    checkRole("USER"),
    denyApiKeys(),
    checkClientRoles([]),
    async (req, res) => {
      const ctx = Ctx.get(req)!.context;
      res.json(
        _.omit(
          await getApiCall(req.params.clientId, req.params.id, {
            user_id: (await isManager(req)) ? undefined : ctx.id,
          }),
          ["operation", "operation_timestamp"]
        )
      );
    }
  );
};
