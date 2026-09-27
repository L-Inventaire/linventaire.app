import crypto from "crypto";
import NodeCache from "node-cache";
import platform from "../../../platform";
import { id } from "../../../platform/db/utils";
import {
  BadRequestError,
  Context,
  createContext,
  NotFoundError,
} from "../../../types";
import Services from "../..";
import {
  ClientsUsersDefinition,
  default as ClientsUsers,
} from "../../clients/entities/clients-users";
import ApiKeys, { ApiKeysDefinition, PublicApiKey } from "../entities/api-keys";

// Every key starts with this prefix, it lets us distinguish api keys from JWT
// tokens in the Authorization header and makes leaked keys easy to detect.
export const API_KEY_PREFIX = "lin_";

// A key can be used by many requests per second, avoid hitting the database for
// each one of them. Revoked keys are removed from this cache immediately on this
// instance and within CACHE_TTL seconds on the other ones.
const CACHE_TTL = 30;
const LAST_USED_REFRESH = 60 * 1000;
const cache = new NodeCache({ stdTTL: CACHE_TTL });

const MAX_KEYS_PER_USER = 50;

export const isApiKey = (value?: string | null): value is string =>
  typeof value === "string" && value.startsWith(API_KEY_PREFIX);

export const hashApiKey = (key: string) =>
  crypto.createHash("sha256").update(key).digest("hex");

const generateApiKey = () =>
  API_KEY_PREFIX + crypto.randomBytes(32).toString("base64url");

// BIGINT columns are returned as strings by pg
const toTimestamp = (value: any): number | null =>
  value === null || value === undefined || value === "" ? null : Number(value);

const normalize = (key: ApiKeys): ApiKeys => ({
  ...key,
  created_at: toTimestamp(key.created_at),
  expires_at: toTimestamp(key.expires_at),
  last_used_at: toTimestamp(key.last_used_at),
  revoked_at: toTimestamp(key.revoked_at),
});

export const toPublicApiKey = (key: ApiKeys): PublicApiKey => ({
  id: key.id,
  client_id: key.client_id,
  user_id: key.user_id,
  name: key.name,
  key_prefix: key.key_prefix,
  created_at: toTimestamp(key.created_at),
  expires_at: toTimestamp(key.expires_at),
  last_used_at: toTimestamp(key.last_used_at),
  revoked_at: toTimestamp(key.revoked_at),
  revoked_by: key.revoked_by || null,
});

const isActive = (key: ApiKeys) =>
  !key.revoked_at && (!key.expires_at || key.expires_at > Date.now());

export const listApiKeys = async (
  ctx: Context,
  clientId: string,
  options: { all?: boolean } = {}
): Promise<PublicApiKey[]> => {
  const db = await platform.Db.getService();
  const keys = await db.select<ApiKeys>(ctx, ApiKeysDefinition.name, {
    client_id: clientId,
    ...(options.all ? {} : { user_id: ctx.id }),
  });
  return keys
    .map(normalize)
    .sort((a, b) => b.created_at - a.created_at)
    .map(toPublicApiKey);
};

export const createApiKey = async (
  ctx: Context,
  clientId: string,
  body: { name?: string; expires_at?: number | null }
): Promise<PublicApiKey & { key: string }> => {
  const name = `${body?.name || ""}`.trim().slice(0, 256);
  if (!name) throw BadRequestError("A name is required");

  const expiresAt = body?.expires_at ? Number(body.expires_at) : null;
  if (expiresAt !== null && (!expiresAt || expiresAt <= Date.now())) {
    throw BadRequestError("expires_at must be a future timestamp (ms)");
  }

  const existing = await listApiKeys(ctx, clientId);
  if (existing.filter((k) => !k.revoked_at).length >= MAX_KEYS_PER_USER) {
    throw BadRequestError(
      `You can't have more than ${MAX_KEYS_PER_USER} api keys`
    );
  }

  const key = generateApiKey();
  const apiKey: ApiKeys = {
    id: id(),
    client_id: clientId,
    user_id: ctx.id,
    name,
    key_prefix: key.slice(0, API_KEY_PREFIX.length + 8),
    key_hash: hashApiKey(key),
    created_at: Date.now(),
    expires_at: expiresAt,
    last_used_at: null,
    revoked_at: null,
    revoked_by: null,
  };

  const db = await platform.Db.getService();
  await db.insert<ApiKeys>(ctx, ApiKeysDefinition.name, apiKey, {
    triggers: false,
  });

  // The full key is only returned once, at creation
  return { ...toPublicApiKey(apiKey), key };
};

export const revokeApiKey = async (
  ctx: Context,
  clientId: string,
  keyId: string,
  options: { any_user?: boolean } = {}
) => {
  const db = await platform.Db.getService();
  const found = await db.selectOne<ApiKeys>(ctx, ApiKeysDefinition.name, {
    id: keyId,
    client_id: clientId,
  });
  const key = found && normalize(found);
  if (!key || (!options.any_user && key.user_id !== ctx.id)) {
    throw NotFoundError("Api key not found");
  }
  if (!key.revoked_at) {
    await db.update<ApiKeys>(
      ctx,
      ApiKeysDefinition.name,
      { id: key.id },
      { revoked_at: Date.now(), revoked_by: ctx.id },
      { triggers: false }
    );
  }
  cache.del(key.key_hash);
  return toPublicApiKey({
    ...key,
    revoked_at: key.revoked_at || Date.now(),
    revoked_by: key.revoked_by || ctx.id,
  });
};

/**
 * Resolve an api key to its owner. Returns null if the key is unknown, revoked,
 * expired, or if its owner lost access to the company (or the whole platform).
 */
export const authenticateApiKey = async (
  key: string
): Promise<ApiKeys | null> => {
  if (!isApiKey(key)) return null;
  const hash = hashApiKey(key);

  let apiKey = cache.get<ApiKeys | false>(hash);
  if (apiKey === undefined) {
    apiKey = (await loadAndValidateApiKey(hash)) || false;
    cache.set(hash, apiKey);
  }
  if (!apiKey || !isActive(apiKey)) return null;

  if (
    !apiKey.last_used_at ||
    Date.now() - apiKey.last_used_at > LAST_USED_REFRESH
  ) {
    apiKey.last_used_at = Date.now();
    touchApiKey(apiKey.id).catch((e) => console.error(e));
  }

  return apiKey;
};

const loadAndValidateApiKey = async (hash: string) => {
  const ctx = createContext("SYSTEM", "SYSTEM");
  const db = await platform.Db.getService();

  const apiKey = await db.selectOne<ApiKeys>(ctx, ApiKeysDefinition.name, {
    key_hash: hash,
  });
  if (!apiKey || !isActive(normalize(apiKey))) return null;

  const user = await Services.Users.getUser(ctx, { id: apiKey.user_id });
  if (!user || user.role === "DISABLED") return null;

  const membership = await db.selectOne<ClientsUsers>(
    ctx,
    ClientsUsersDefinition.name,
    {
      client_id: apiKey.client_id,
      user_id: apiKey.user_id,
      active: true,
    }
  );
  if (!membership) return null;

  return normalize(apiKey);
};

const touchApiKey = async (keyId: string) => {
  const db = await platform.Db.getService();
  await db.update<ApiKeys>(
    createContext("SYSTEM", "SYSTEM"),
    ApiKeysDefinition.name,
    { id: keyId },
    { last_used_at: Date.now() },
    { triggers: false }
  );
};
