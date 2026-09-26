import { Context } from "#src/types";
import { v4 } from "uuid";
import Redis from "../redis";
import { PlatformService } from "../types";

// Handles returned to callers: maps an opaque lockId to the underlying Redis
// key and the owner token, so release()/extend() can prove ownership. This map
// is process-local, which is fine because a lockId is only ever known to the
// process that acquired it; if that process dies, the lock expires via its TTL.
const handles: {
  [lockId: string]: {
    key: string;
    token: string;
  };
} = {};

// In-memory fallback used only when Redis is disabled. NOT distributed: it only
// serializes within a single process. A multi-instance deployment must enable
// Redis for locks (e.g. cron de-duplication) to be effective across instances.
const memoryLocks: {
  [key: string]: {
    token: string;
    exp: number;
  };
} = {};

const RELEASE_SCRIPT = `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`;
const EXTEND_SCRIPT = `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("pexpire", KEYS[1], ARGV[2]) else return 0 end`;

export default class Lock implements PlatformService {
  private redis: Redis;

  public async init(redis: Redis) {
    this.redis = redis;
    return this;
  }

  private redisKey(key: string) {
    return "lock:" + key;
  }

  /**
   * Acquire a lock atomically. Returns an opaque lockId on success, or null if
   * the lock is already held. `ttl` is in milliseconds.
   */
  public async acquire(_ctx: Context, key: string, ttl = 5000) {
    const token = v4();
    const lockId = v4();
    const client = this.redis.getClient();

    if (client) {
      // Atomic "set if not exists with expiry" — no check-then-set race.
      const res = await client.set(
        this.redisKey(key),
        token,
        "PX",
        ttl,
        "NX"
      );
      if (res !== "OK") return null;
    } else {
      const existing = memoryLocks[key];
      if (existing && existing.exp > Date.now()) return null;
      memoryLocks[key] = { token, exp: Date.now() + ttl };
    }

    handles[lockId] = { key, token };
    return lockId;
  }

  public async isLocked(_ctx: Context, key: string) {
    const client = this.redis.getClient();
    if (client) {
      return (await client.exists(this.redisKey(key))) === 1;
    }
    const existing = memoryLocks[key];
    return !!existing && existing.exp > Date.now();
  }

  /**
   * Extend the TTL of a lock we still own. Returns the lockId on success or
   * false if we no longer hold it. `ttl` is in milliseconds.
   */
  public async extend(_ctx: Context, lockId: string, ttl = 5000) {
    const handle = handles[lockId];
    if (!handle) return false;

    const client = this.redis.getClient();
    if (client) {
      const ok = await client.eval(
        EXTEND_SCRIPT,
        1,
        this.redisKey(handle.key),
        handle.token,
        String(ttl)
      );
      if (ok !== 1) {
        delete handles[lockId];
        return false;
      }
    } else {
      const existing = memoryLocks[handle.key];
      if (!existing || existing.token !== handle.token) {
        delete handles[lockId];
        return false;
      }
      existing.exp = Date.now() + ttl;
    }

    return lockId;
  }

  /**
   * Release a lock, but only if we still own it (compare-and-delete), so we
   * never delete a lock another instance acquired after ours expired.
   */
  public async release(_ctx: Context, lockId: string) {
    const handle = handles[lockId];
    if (!handle) return false;

    const client = this.redis.getClient();
    if (client) {
      await client.eval(
        RELEASE_SCRIPT,
        1,
        this.redisKey(handle.key),
        handle.token
      );
    } else {
      const existing = memoryLocks[handle.key];
      if (existing && existing.token === handle.token) {
        delete memoryLocks[handle.key];
      }
    }

    delete handles[lockId];
    return true;
  }
}
