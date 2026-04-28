import config from "config";
import RedisClient from "ioredis";
import { Context } from "../../types";
import { PlatformService } from "../types";

export const isRedisEnabled = () => {
  return config.get<boolean>("redis.use");
};

export const getRedisConfiguration = () => {
  return {
    host:
      config.get<string>("redis.url").split("://").pop()?.split(":")[0] ||
      "localhost",
    port: parseInt(config.get<string>("redis.url").split(":").pop() || "6379"),
    tls: config.get<string>("redis.url").includes("amazonaws.com")
      ? {}
      : undefined,
  };
};

export default class Redis implements PlatformService {
  private client: RedisClient | null = null;
  private store: any = {};

  async init() {
    if (isRedisEnabled()) {
      this.client = new RedisClient(getRedisConfiguration());
      this.client.on("connect", function () {
        console.log("[redis] Connected!");
      });
      this.client.on("error", function (err) {
        console.log("[redis] Error " + err);
      });
      console.log("[redis] Connecting...");
    }
    return this;
  }

  /**
   * ⚠️ WARNING: This method should ONLY be used by the rate limiter.
   * For all other use cases, use the set(), get(), keys(), del() methods
   * which are compatible with both Redis and in-memory storage.
   */
  getClient(): RedisClient | null {
    return this.client;
  }

  // TTL in seconds
  async set(_context: Context, key: string, value: any, ttl = 0) {
    if (!this.client) {
      this.store["data_" + key] = JSON.stringify(value);
      this.store["data_" + key + "_ttl"] =
        ttl > 0 ? Date.now() + ttl * 1000 : null;
      return;
    }
    await this.client.set("data_" + key, JSON.stringify(value));
    if (ttl > 0) {
      // Set TTL in seconds
      await this.client.expire("data_" + key, ttl);
    }
  }

  async get(_context: Context, key: string) {
    if (!this.client) {
      if (
        this.store["data_" + key + "_ttl"] &&
        Date.now() > this.store["data_" + key + "_ttl"]
      ) {
        delete this.store["data_" + key];
        delete this.store["data_" + key + "_ttl"];
        return null;
      }
      return this.store["data_" + key]
        ? JSON.parse(this.store["data_" + key])
        : null;
    }
    const d = await this.client.get("data_" + key);
    if (!d) return null;
    return JSON.parse(d);
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.client) {
      // Mode mémoire: filtrer les clés du store selon le pattern
      const regex = new RegExp(
        "^" + pattern.replace(/\*/g, ".*").replace(/\?/g, ".") + "$"
      );
      return Object.keys(this.store).filter(
        (key) => !key.endsWith("_ttl") && regex.test(key)
      );
    }
    return await this.client.keys(pattern);
  }

  async del(...keys: string[]): Promise<number> {
    if (!this.client) {
      // Mode mémoire: supprimer les clés du store
      let count = 0;
      for (const key of keys) {
        if (this.store[key]) {
          delete this.store[key];
          delete this.store[key + "_ttl"];
          count++;
        }
      }
      return count;
    }
    return await this.client.del(...keys);
  }
}
