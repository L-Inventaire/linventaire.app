import { captureException } from "@sentry/node";
import _ from "lodash";
import { default as Framework, default as platform } from "../../../platform";
import { id } from "../../../platform/db/utils";
import { Context, createContext, NotFoundError } from "../../../types";
import { checkRoles } from "../../clients/services/client-roles";
import { isTableAvailable } from "../../rest/services/utils";
import WebhookDeliveries, {
  WebhookAttempt,
  WebhookDeliveriesDefinition,
} from "../entities/webhook-deliveries";
import Webhooks, {
  WebhookEvent,
  WebhooksDefinition,
} from "../entities/webhooks";
import { truncateBody } from "./api-calls";
import {
  getEnabledWebhooks,
  invalidateWebhooksCache,
  getWebhookTables,
} from "./webhooks";
import { getWebhookUrlError, signWebhookPayload } from "./webhooks-security";

export const RETENTION_DAYS = 30;
const MINUTE = 60 * 1000;
// Delay before each retry, the delivery is abandoned after the last one (~1 day)
export const RETRY_DELAYS = [
  1 * MINUTE,
  5 * MINUTE,
  15 * MINUTE,
  60 * MINUTE,
  3 * 60 * MINUTE,
  6 * 60 * MINUTE,
  12 * 60 * MINUTE,
];
export const MAX_ATTEMPTS = RETRY_DELAYS.length + 1;
// The webhook is disabled after this many deliveries failed in a row
export const MAX_CONSECUTIVE_FAILURES = 20;
const REQUEST_TIMEOUT = 10 * 1000;
const MAX_RESPONSE_BODY = 2 * 1024;
const BATCH_SIZE = 20;

// Internal columns never sent to webhooks, like in the REST api
const HIDDEN_FIELDS = [
  "searchable",
  "searchable_generated",
  "comment_id",
  "operation",
  "operation_timestamp",
  "_rank",
];

const cleanDocument = (table: string, document: any) =>
  document
    ? _.omit(document, [
        ...HIDDEN_FIELDS,
        ...(Framework.TriggersManager.getEntities()[table]?.rest?.hidden || []),
      ])
    : null;

export const getNextAttemptAt = (attempts: number, now = Date.now()) =>
  attempts >= MAX_ATTEMPTS ? null : now + RETRY_DELAYS[attempts - 1];

/**
 * Called on every change of a document: creates one delivery per webhook listening
 * to this change. Deliveries are saved in the same transaction as the change, so a
 * rolled back change never reaches webhooks, and sent by the worker right after.
 */
export const setWebhooksTrigger = () => {
  Framework.TriggersManager.registerTrigger<any>("*", {
    name: "webhooks-deliveries",
    priority: 1000, // After all other triggers
    test: (ctx, _entity, _oldEntity, meta) =>
      !!ctx.client_id && getWebhookTables().includes(meta?.table || ""),
    callback: async (ctx, entity, oldEntity, meta) => {
      try {
        await enqueueDeliveries(ctx, meta!.table, entity, oldEntity);
      } catch (e) {
        // Webhooks must never break the change itself
        console.error(e);
        captureException(e);
      }
    },
  });
};

// The owner must still be allowed to use the API and to read the document
const canOwnerRead = async (
  webhook: Webhooks,
  table: string,
  document: any
) => {
  const ownerCtx = {
    ...createContext(webhook.user_id, "USER"),
    client_id: webhook.client_id,
  };
  try {
    return (
      (await checkRoles(ownerCtx, webhook.client_id, ["API_ACCESS"])) &&
      (await isTableAvailable(ownerCtx, table, "READ", document))
    );
  } catch (e) {
    // Includes owners who lost access or are blocked by an IP restriction
    return false;
  }
};

export const enqueueDeliveries = async (
  ctx: Context,
  table: string,
  entity: any,
  oldEntity: any
) => {
  const webhooks = (await getEnabledWebhooks(ctx.client_id)).filter((w) =>
    (w.entities || []).includes(table)
  );
  if (!webhooks.length) return;

  const action: WebhookEvent = !entity
    ? "deleted"
    : !oldEntity
    ? "created"
    : "updated";
  const document = entity || oldEntity;
  const now = Date.now();
  const db = await platform.Db.getService();
  let enqueued = false;

  for (const webhook of webhooks) {
    if (!(webhook.events || []).includes(action)) continue;
    if (!(await canOwnerRead(webhook, table, document))) continue;

    const deliveryId = id();
    const delivery: WebhookDeliveries = {
      id: deliveryId,
      client_id: ctx.client_id,
      webhook_id: webhook.id,
      event: `${table}.${action}`,
      entity_table: table,
      entity_id: document?.id || null,
      payload: {
        id: deliveryId,
        event: `${table}.${action}`,
        entity: table,
        action,
        client_id: ctx.client_id,
        created_at: now,
        data: cleanDocument(table, document),
        ...(action === "updated"
          ? { previous_data: cleanDocument(table, oldEntity) }
          : {}),
      },
      status: "pending",
      attempts: 0,
      attempts_log: { list: [] },
      next_attempt_at: now,
      locked_until: null,
      last_attempt_at: null,
      response_status: null,
      duration_ms: null,
      error: null,
      created_at: now,
      completed_at: null,
    };

    await db.insert<WebhookDeliveries>(
      // Same transaction as the change
      { ...createContext("SYSTEM", "SYSTEM"), db_tnx: ctx.db_tnx },
      WebhookDeliveriesDefinition.name,
      delivery,
      { triggers: false }
    );
    enqueued = true;
  }

  // Don't wait for the next worker tick, the delay lets the transaction commit
  if (enqueued) setTimeout(() => processDueDeliveries(), 1000);
};

/**
 * Sends the delivery once and records the attempt. Returns the updated delivery.
 */
const attemptDelivery = async (
  delivery: WebhookDeliveries,
  options: { manual?: boolean } = {}
): Promise<WebhookDeliveries> => {
  const ctx = createContext("SYSTEM", "SYSTEM");
  const db = await platform.Db.getService();
  const webhook = await db.selectOne<Webhooks>(ctx, WebhooksDefinition.name, {
    id: delivery.webhook_id,
  });

  const start = Date.now();
  const attempt: WebhookAttempt = {
    at: start,
    status: null,
    duration_ms: 0,
    error: null,
    response_body: null,
    ...(options.manual ? { manual: true } : {}),
  };

  if (!webhook) {
    attempt.error = "The webhook was deleted";
  } else if (!webhook.enabled && !options.manual) {
    attempt.error = "The webhook is disabled";
  } else {
    attempt.error = await getWebhookUrlError(webhook.url);
  }

  if (!attempt.error && webhook) {
    const body = JSON.stringify(delivery.payload);
    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        body,
        redirect: "manual", // Redirects could target private networks
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Linventaire-Webhooks/1.0",
          "X-Linventaire-Event": delivery.event,
          "X-Linventaire-Delivery": delivery.id,
          "X-Linventaire-Signature": signWebhookPayload(webhook.secret, body),
        },
      });
      attempt.status = response.status;
      const text = await response.text().catch(() => "");
      attempt.response_body =
        truncateBody(text.slice(0, MAX_RESPONSE_BODY + 1)).value?.slice(
          0,
          MAX_RESPONSE_BODY
        ) || null;
      if (response.status < 200 || response.status >= 300) {
        attempt.error = `HTTP ${response.status}`;
      }
    } catch (e: any) {
      attempt.error =
        e?.name === "TimeoutError"
          ? `Timeout after ${REQUEST_TIMEOUT / 1000}s`
          : `${e?.cause?.code || e?.message || e}`.slice(0, 500);
    }
  }
  attempt.duration_ms = Date.now() - start;

  const success = !attempt.error;
  const attempts = (delivery.attempts || 0) + 1;
  // Manual retries never schedule automatic retries
  const nextAttemptAt =
    success || options.manual || !webhook
      ? null
      : getNextAttemptAt(attempts, attempt.at);
  const status: WebhookDeliveries["status"] = success
    ? "success"
    : nextAttemptAt
    ? "pending"
    : "failed";

  const changes: Partial<WebhookDeliveries> = {
    status,
    attempts,
    attempts_log: {
      list: [...(delivery.attempts_log?.list || []), attempt].slice(-20),
    },
    next_attempt_at: nextAttemptAt,
    locked_until: null,
    last_attempt_at: attempt.at,
    response_status: attempt.status,
    duration_ms: attempt.duration_ms,
    error: attempt.error,
    completed_at: status === "pending" ? null : Date.now(),
  };
  await db.update<WebhookDeliveries>(
    ctx,
    WebhookDeliveriesDefinition.name,
    { id: delivery.id },
    changes,
    { triggers: false }
  );

  if (webhook && status !== "pending" && delivery.event !== "ping") {
    await updateWebhookHealth(webhook, success);
  }

  return { ...delivery, ...changes } as WebhookDeliveries;
};

const updateWebhookHealth = async (webhook: Webhooks, success: boolean) => {
  const db = await platform.Db.getService();
  const failures = success ? 0 : (webhook.consecutive_failures || 0) + 1;
  const disable =
    !success && webhook.enabled && failures >= MAX_CONSECUTIVE_FAILURES;
  await db.update<Webhooks>(
    createContext("SYSTEM", "SYSTEM"),
    WebhooksDefinition.name,
    { id: webhook.id },
    {
      consecutive_failures: failures,
      last_delivery_at: Date.now(),
      last_delivery_status: success ? "success" : "failed",
      ...(disable
        ? {
            enabled: false,
            disabled_reason: `Disabled after ${failures} failed deliveries in a row`,
          }
        : {}),
    },
    { triggers: false }
  );
  if (disable) invalidateWebhooksCache(webhook.client_id);
};

let processing = false;

/**
 * Sends the deliveries that are due. Rows are claimed with SKIP LOCKED so several
 * instances can run the worker at the same time without sending twice.
 */
export const processDueDeliveries = async () => {
  if (processing) return;
  processing = true;
  try {
    const db = await platform.Db.getService();
    const ctx = createContext("SYSTEM", "SYSTEM");
    for (let batch = 0; batch < 10; batch++) {
      const now = Date.now();
      const claimed = await db.custom<{ rows: any[] }>(
        ctx,
        `UPDATE ${WebhookDeliveriesDefinition.name}
        SET status = 'sending', locked_until = $1
        WHERE id IN (
          SELECT id FROM ${WebhookDeliveriesDefinition.name}
          WHERE (status = 'pending' AND next_attempt_at <= $2)
            OR (status = 'sending' AND locked_until < $2)
          ORDER BY next_attempt_at
          LIMIT ${BATCH_SIZE}
          FOR UPDATE SKIP LOCKED
        )
        RETURNING *`,
        [now + 2 * REQUEST_TIMEOUT, now]
      );
      const deliveries = (claimed?.rows || []) as WebhookDeliveries[];
      if (!deliveries.length) break;
      await Promise.all(
        deliveries.map((delivery) =>
          attemptDelivery(delivery).catch((e) => {
            console.error(e);
            captureException(e);
          })
        )
      );
      if (deliveries.length < BATCH_SIZE) break;
    }
  } catch (e) {
    console.error(e);
    captureException(e);
  } finally {
    processing = false;
  }
};

let worker: NodeJS.Timeout | null = null;

export const startDeliveriesWorker = () => {
  if (worker) return;
  // New deliveries are sent right away (see enqueueDeliveries), polling only
  // catches up retries and deliveries created on other instances
  worker = setInterval(() => processDueDeliveries(), 15000);
};

export const stopDeliveriesWorker = () => {
  if (worker) clearInterval(worker);
  worker = null;
};

const LIST_COLUMNS = [
  "id",
  "webhook_id",
  "event",
  "entity_table",
  "entity_id",
  "status",
  "attempts",
  "next_attempt_at",
  "last_attempt_at",
  "response_status",
  "duration_ms",
  "error",
  "created_at",
  "completed_at",
];

// Raw queries return BIGINT as strings
const toNumber = (value: any) =>
  value === null || value === undefined ? null : Number(value);

export const listDeliveries = async (
  clientId: string,
  webhookId: string,
  options: { status?: string; limit?: number; offset?: number } = {}
) => {
  const db = await platform.Db.getService();
  const ctx = createContext("SYSTEM", "SYSTEM");
  const values: any[] = [clientId, webhookId];
  let where = "client_id = $1 AND webhook_id = $2";
  if (options.status === "failed") {
    where += " AND status = 'failed'";
  } else if (options.status === "success") {
    where += " AND status = 'success'";
  } else if (options.status === "pending") {
    where += " AND status IN ('pending', 'sending')";
  }
  const limit = Math.max(1, Math.min(100, options.limit || 50));
  const offset = Math.max(0, options.offset || 0);

  const [rows, count] = await Promise.all([
    db.custom<{ rows: any[] }>(
      ctx,
      `SELECT ${LIST_COLUMNS.join(", ")} FROM ${
        WebhookDeliveriesDefinition.name
      } WHERE ${where} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      values
    ),
    db.custom<{ rows: any[] }>(
      ctx,
      `SELECT COUNT(*) AS total FROM ${WebhookDeliveriesDefinition.name} WHERE ${where}`,
      values
    ),
  ]);

  return {
    total: toNumber(count.rows[0]?.total) || 0,
    list: rows.rows.map((row: any) => ({
      ...row,
      next_attempt_at: toNumber(row.next_attempt_at),
      last_attempt_at: toNumber(row.last_attempt_at),
      created_at: toNumber(row.created_at),
      completed_at: toNumber(row.completed_at),
    })),
  };
};

export const getDelivery = async (clientId: string, deliveryId: string) => {
  const db = await platform.Db.getService();
  const delivery = await db.selectOne<WebhookDeliveries>(
    createContext("SYSTEM", "SYSTEM"),
    WebhookDeliveriesDefinition.name,
    { id: deliveryId, client_id: clientId }
  );
  if (!delivery) throw NotFoundError("Delivery not found");
  return _.omit(delivery, ["operation", "operation_timestamp"]) as any;
};

// Sends the delivery again right now, whatever its status
export const retryDelivery = async (delivery: WebhookDeliveries) => {
  const db = await platform.Db.getService();
  // Claim it so the worker doesn't send it at the same time
  const claimed = await db.custom<{ rows: any[] }>(
    createContext("SYSTEM", "SYSTEM"),
    `UPDATE ${WebhookDeliveriesDefinition.name} SET status = 'sending', locked_until = $1
    WHERE id = $2 AND (status <> 'sending' OR locked_until < $3) RETURNING *`,
    [Date.now() + 2 * REQUEST_TIMEOUT, delivery.id, Date.now()]
  );
  if (!claimed?.rows?.length) return delivery;
  return _.omit(await attemptDelivery(claimed.rows[0], { manual: true }), [
    "operation",
    "operation_timestamp",
  ]);
};

// Sends a "ping" event to check the endpoint and the signature
export const sendTestDelivery = async (webhook: Webhooks) => {
  const now = Date.now();
  const deliveryId = id();
  const delivery: WebhookDeliveries = {
    id: deliveryId,
    client_id: webhook.client_id,
    webhook_id: webhook.id,
    event: "ping",
    entity_table: null,
    entity_id: null,
    payload: {
      id: deliveryId,
      event: "ping",
      client_id: webhook.client_id,
      created_at: now,
      data: { webhook_id: webhook.id, message: "Hello from L'inventaire" },
    },
    status: "sending",
    attempts: 0,
    attempts_log: { list: [] },
    next_attempt_at: null,
    locked_until: now + 2 * REQUEST_TIMEOUT,
    last_attempt_at: null,
    response_status: null,
    duration_ms: null,
    error: null,
    created_at: now,
    completed_at: null,
  };
  const db = await platform.Db.getService();
  await db.insert<WebhookDeliveries>(
    createContext("SYSTEM", "SYSTEM"),
    WebhookDeliveriesDefinition.name,
    delivery,
    { triggers: false }
  );
  return _.omit(await attemptDelivery(delivery, { manual: true }), [
    "operation",
    "operation_timestamp",
  ]);
};

export const deleteWebhookDeliveries = async (webhookId: string) => {
  const db = await platform.Db.getService();
  await db.custom<{ rows: any[] }>(
    createContext("SYSTEM", "SYSTEM"),
    `DELETE FROM ${WebhookDeliveriesDefinition.name} WHERE webhook_id = $1`,
    [webhookId]
  );
};

export const purgeOldDeliveries = async () => {
  const db = await platform.Db.getService();
  await db.custom<{ rows: any[] }>(
    createContext("SYSTEM", "SYSTEM"),
    `DELETE FROM ${WebhookDeliveriesDefinition.name} WHERE created_at < $1 AND status IN ('success', 'failed')`,
    [Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000]
  );
};
