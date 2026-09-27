import _ from "lodash";
import NodeCache from "node-cache";
import platform from "../../../platform";
import { id } from "../../../platform/db/utils";
import {
  BadRequestError,
  Context,
  createContext,
  NotFoundError,
} from "../../../types";
import { isTableAvailable } from "../../rest/services/utils";
import Webhooks, {
  PublicWebhook,
  WEBHOOK_EVENTS,
  WebhookEvent,
  WebhooksDefinition,
} from "../entities/webhooks";
import { DocumentedEntities } from "../openapi/entities";
import { generateWebhookSecret, getWebhookUrlError } from "./webhooks-security";

// Entities that can be listened to, the same ones as the public documentation
// (a function, not a constant, as entities.ts and this file import each other through the services)
export const getWebhookTables = () =>
  DocumentedEntities.map((e) => e.definition.name);

const MAX_WEBHOOKS_PER_CLIENT = 50;

export const toPublicWebhook = (webhook: Webhooks): PublicWebhook =>
  _.omit(webhook, ["secret", "operation", "operation_timestamp"]) as any;

// Enabled webhooks by client, read on every change of a document
const cache = new NodeCache({ stdTTL: 30 });

export const invalidateWebhooksCache = (clientId: string) =>
  cache.del(clientId);

export const getEnabledWebhooks = async (
  clientId: string
): Promise<Webhooks[]> => {
  let webhooks = cache.get<Webhooks[]>(clientId);
  if (!webhooks) {
    const db = await platform.Db.getService();
    webhooks = await db.select<Webhooks>(
      createContext("SYSTEM", "SYSTEM"),
      WebhooksDefinition.name,
      { client_id: clientId, enabled: true }
    );
    cache.set(clientId, webhooks);
  }
  return webhooks;
};

const validate = async (
  ctx: Context,
  clientId: string,
  body: Partial<Webhooks>,
  previous?: Webhooks
) => {
  const webhook: Partial<Webhooks> = {};

  if (body.name !== undefined || !previous) {
    webhook.name = `${body.name || ""}`.trim().slice(0, 256);
    if (!webhook.name) throw BadRequestError("A name is required");
  }

  if (body.url !== undefined || !previous) {
    webhook.url = `${body.url || ""}`.trim();
    const error = await getWebhookUrlError(webhook.url);
    if (error) throw BadRequestError(error);
  }

  if (body.entities !== undefined || !previous) {
    const entities = _.uniq(_.isArray(body.entities) ? body.entities : []);
    if (!entities.length) {
      throw BadRequestError("Select at least one entity");
    }
    const unknown = entities.filter((e) => !getWebhookTables().includes(e));
    if (unknown.length) {
      throw BadRequestError(`Unknown entities: ${unknown.join(", ")}`);
    }
    // The owner must be able to read what the webhook will send
    for (const table of entities) {
      let allowed = false;
      try {
        allowed = await isTableAvailable(
          { ...ctx, client_id: clientId },
          table,
          "READ"
        );
      } catch (e) {
        allowed = false;
      }
      if (!allowed) {
        throw BadRequestError(`You don't have access to ${table}`);
      }
    }
    webhook.entities = entities;
  }

  if (body.events !== undefined || !previous) {
    const events = _.uniq(
      _.isArray(body.events) ? body.events : [...WEBHOOK_EVENTS]
    ) as WebhookEvent[];
    if (!events.length || events.some((e) => !WEBHOOK_EVENTS.includes(e))) {
      throw BadRequestError(
        `events must be a list of: ${WEBHOOK_EVENTS.join(", ")}`
      );
    }
    webhook.events = events;
  }

  if (body.enabled !== undefined) {
    webhook.enabled = !!body.enabled;
    if (webhook.enabled) {
      webhook.disabled_reason = null;
      webhook.consecutive_failures = 0;
    }
  }

  return webhook;
};

export const listWebhooks = async (
  ctx: Context,
  clientId: string,
  options: { all?: boolean } = {}
): Promise<PublicWebhook[]> => {
  const db = await platform.Db.getService();
  const webhooks = await db.select<Webhooks>(ctx, WebhooksDefinition.name, {
    client_id: clientId,
    ...(options.all ? {} : { user_id: ctx.id }),
  });
  return _.sortBy(webhooks, (w) => -w.created_at).map(toPublicWebhook);
};

export const getWebhook = async (
  ctx: Context,
  clientId: string,
  webhookId: string,
  options: { any_user?: boolean } = {}
): Promise<Webhooks> => {
  const db = await platform.Db.getService();
  const webhook = await db.selectOne<Webhooks>(ctx, WebhooksDefinition.name, {
    id: webhookId,
    client_id: clientId,
  });
  if (!webhook || (!options.any_user && webhook.user_id !== ctx.id)) {
    throw NotFoundError("Webhook not found");
  }
  return webhook;
};

export const createWebhook = async (
  ctx: Context,
  clientId: string,
  body: Partial<Webhooks>
): Promise<PublicWebhook & { secret: string }> => {
  const db = await platform.Db.getService();
  const count = await db.count(ctx, WebhooksDefinition.name, {
    client_id: clientId,
  });
  if (count >= MAX_WEBHOOKS_PER_CLIENT) {
    throw BadRequestError(
      `A company can't have more than ${MAX_WEBHOOKS_PER_CLIENT} webhooks`
    );
  }

  const webhook: Webhooks = {
    ...(await validate(ctx, clientId, body)),
    id: id(),
    client_id: clientId,
    user_id: ctx.id,
    secret: generateWebhookSecret(),
    enabled: body.enabled === undefined ? true : !!body.enabled,
    disabled_reason: null,
    consecutive_failures: 0,
    last_delivery_at: null,
    last_delivery_status: null,
    created_at: Date.now(),
    updated_at: Date.now(),
  } as Webhooks;

  await db.insert<Webhooks>(ctx, WebhooksDefinition.name, webhook, {
    triggers: false,
  });
  invalidateWebhooksCache(clientId);

  // The secret is returned only here and when rotated
  return { ...toPublicWebhook(webhook), secret: webhook.secret };
};

export const updateWebhook = async (
  ctx: Context,
  clientId: string,
  webhookId: string,
  body: Partial<Webhooks>,
  options: { any_user?: boolean } = {}
): Promise<PublicWebhook> => {
  const previous = await getWebhook(ctx, clientId, webhookId, options);
  // Permissions are checked against the owner of the webhook
  const ownerCtx =
    previous.user_id === ctx.id
      ? ctx
      : { ...createContext(previous.user_id, "USER"), ip: ctx.ip };
  const changes = await validate(ownerCtx, clientId, body, previous);

  const db = await platform.Db.getService();
  await db.update<Webhooks>(
    ctx,
    WebhooksDefinition.name,
    { id: previous.id },
    { ...changes, updated_at: Date.now() },
    { triggers: false }
  );
  invalidateWebhooksCache(clientId);
  return toPublicWebhook({ ...previous, ...changes } as Webhooks);
};

export const rotateWebhookSecret = async (
  ctx: Context,
  clientId: string,
  webhookId: string,
  options: { any_user?: boolean } = {}
) => {
  const webhook = await getWebhook(ctx, clientId, webhookId, options);
  const secret = generateWebhookSecret();
  const db = await platform.Db.getService();
  await db.update<Webhooks>(
    ctx,
    WebhooksDefinition.name,
    { id: webhook.id },
    { secret, updated_at: Date.now() },
    { triggers: false }
  );
  invalidateWebhooksCache(clientId);
  return { ...toPublicWebhook(webhook), secret };
};

export const deleteWebhook = async (
  ctx: Context,
  clientId: string,
  webhookId: string,
  options: { any_user?: boolean } = {}
) => {
  const webhook = await getWebhook(ctx, clientId, webhookId, options);
  const db = await platform.Db.getService();
  await db.delete(ctx, WebhooksDefinition.name, { id: webhook.id });
  invalidateWebhooksCache(clientId);
  return true;
};
