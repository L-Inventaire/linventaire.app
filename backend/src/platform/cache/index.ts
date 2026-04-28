import { Context } from "../../types";
import { PlatformService } from "../types";
import { Condition } from "../db/api";
import crypto from "crypto";
import Framework from "..";

export type CacheConfig = {
  // Entités à cacher (whitelist)
  cachedEntities: string[];
  // TTL par défaut en secondes
  defaultTTL: number;
  // Nombre max de filtres pour accepter le cache
  maxFiltersForCache: number;
  // TTL spécifique par entité
  entityTTL?: { [entityName: string]: number };
};

export default class CacheService implements PlatformService {
  private logger = Framework.LoggerDb.get("cache");
  private config: CacheConfig = {
    cachedEntities: [
      "clients",
      "clients_users",
      "fields",
      "users",
      "e_invoicing_config",
    ],
    defaultTTL: 2592000, // 30 jours (invalidation auto sur insert/update/delete)
    maxFiltersForCache: 5,
    entityTTL: {
      clients: 2592000, // 30 jours
      clients_users: 2592000,
      fields: 2592000,
      users: 2592000,
      e_invoicing_config: 2592000,
    },
  };

  async init() {
    console.log("[cache] Service initialized");
    return this;
  }

  /**
   * Génère une clé de cache unique basée sur la table, condition, et options
   */
  generateCacheKey<Entity>(
    table: string,
    condition: Condition<Entity>,
    options: any
  ): string {
    const data = {
      table,
      condition,
      limit: options.limit,
      offset: options.offset,
      index: options.index,
      asc: options.asc,
      include_deleted: options.include_deleted,
      count: options.count || false, // Différencier les COUNT des SELECT
    };

    const hash = crypto
      .createHash("md5")
      .update(JSON.stringify(data))
      .digest("hex");

    return `db:${table}:${hash}`;
  }

  /**
   * Vérifie si une entité peut être mise en cache
   */
  canCache<Entity>(
    table: string,
    condition: Condition<Entity>,
    options: any
  ): boolean {
    // 1. Les COUNT sont toujours cachables (peu importe la table) sauf avec full-text search
    if (options.count) {
      // Ne pas cacher si c'est une recherche full-text (rank_query)
      if (options.rank_query || (condition as any).rank_query) {
        return false;
      }
      // Ne pas cacher les requêtes SQL custom
      if ((condition as any).sql) {
        return false;
      }
      return true; // Tous les autres COUNT sont cachables
    }

    // 2. Pour les SELECT normaux, vérifier la whitelist
    if (!this.config.cachedEntities.includes(table)) {
      return false;
    }

    // 3. Ne cacher que si offset = 0 (première page)
    if (options.offset && options.offset > 0) {
      return false;
    }

    // 4. Compter le nombre de filtres
    const filterCount = this.countFilters(condition);
    if (filterCount > this.config.maxFiltersForCache) {
      return false;
    }

    // 5. Ne pas cacher les requêtes SQL custom (rôle SYSTEM avec SQL)
    if ((condition as any).sql) {
      return false;
    }

    return true;
  }

  /**
   * Compte le nombre de filtres dans une condition
   */
  private countFilters<Entity>(condition: Condition<Entity>): number {
    if (!condition || typeof condition !== "object") {
      return 0;
    }

    let count = 0;
    for (const key in condition) {
      if (key === "where" || key === "sql" || key === "values") continue;
      count++;
    }

    return count;
  }

  /**
   * Récupère une valeur du cache
   */
  async get<Entity>(ctx: Context, cacheKey: string): Promise<Entity[] | null> {
    try {
      const cached = await Framework.Redis.get(ctx, cacheKey);
      if (cached) {
        this.logger?.info?.(ctx, `[cache] HIT ${cacheKey}`);
        return cached as Entity[];
      }
      return null;
    } catch (error) {
      console.error("[cache] Error getting from cache:", error);
      return null;
    }
  }

  /**
   * Stocke une valeur dans le cache
   */
  async set<Entity>(
    ctx: Context,
    cacheKey: string,
    table: string,
    value: Entity[]
  ): Promise<void> {
    try {
      const ttl = this.config.entityTTL?.[table] || this.config.defaultTTL;

      // Stocker dans Redis avec TTL (compatible version en mémoire)
      await Framework.Redis.set(ctx, cacheKey, value, ttl);

      this.logger?.info?.(ctx, `[cache] SET ${cacheKey} (TTL: ${ttl}s)`);
    } catch (error) {
      console.error("[cache] Error setting cache:", error);
    }
  }

  /**
   * Invalide tous les caches d'une table
   */
  async invalidate(ctx: Context, table: string): Promise<void> {
    try {
      if (!this.config.cachedEntities.includes(table)) {
        return;
      }

      // Supprimer toutes les clés commençant par db:table:
      const pattern = `data_db:${table}:*`;
      const keys = await Framework.Redis.keys(pattern);

      if (keys.length > 0) {
        await Framework.Redis.del(...keys);
        this.logger?.info?.(
          ctx,
          `[cache] INVALIDATE ${table} (${keys.length} keys)`
        );
      }
    } catch (error) {
      console.error("[cache] Error invalidating cache:", error);
    }
  }

  /**
   * Invalide des caches spécifiques basés sur une condition partielle
   */
  async invalidateMatching(
    ctx: Context,
    table: string,
    partialKey?: string
  ): Promise<void> {
    try {
      if (!this.config.cachedEntities.includes(table)) {
        return;
      }

      const pattern = partialKey
        ? `data_db:${table}:*${partialKey}*`
        : `data_db:${table}:*`;
      const keys = await Framework.Redis.keys(pattern);

      if (keys.length > 0) {
        await Framework.Redis.del(...keys);
        this.logger?.info?.(
          ctx,
          `[cache] INVALIDATE MATCHING ${pattern} (${keys.length} keys)`
        );
      }
    } catch (error) {
      console.error("[cache] Error invalidating matching cache:", error);
    }
  }

  /**
   * Nettoie tous les caches
   */
  async flush(ctx: Context): Promise<void> {
    try {
      const keys = await Framework.Redis.keys("data_db:*");
      if (keys.length > 0) {
        await Framework.Redis.del(...keys);
        this.logger?.info?.(ctx, `[cache] FLUSH ALL (${keys.length} keys)`);
      }
    } catch (error) {
      console.error("[cache] Error flushing cache:", error);
    }
  }

  /**
   * Ajoute une entité à la whitelist
   */
  addCachedEntity(entityName: string, ttl?: number): void {
    if (!this.config.cachedEntities.includes(entityName)) {
      this.config.cachedEntities.push(entityName);
    }
    if (ttl) {
      this.config.entityTTL = this.config.entityTTL || {};
      this.config.entityTTL[entityName] = ttl;
    }
  }

  /**
   * Retire une entité de la whitelist
   */
  removeCachedEntity(entityName: string): void {
    this.config.cachedEntities = this.config.cachedEntities.filter(
      (e) => e !== entityName
    );
  }

  /**
   * Obtient les statistiques du cache
   */
  async getStats(ctx: Context): Promise<any> {
    try {
      const keys = await Framework.Redis.keys("data_db:*");
      const stats: any = {
        total_keys: keys.length,
        by_table: {},
      };

      for (const key of keys) {
        const match = key.match(/data_db:([^:]+):/);
        if (match) {
          const table = match[1];
          stats.by_table[table] = (stats.by_table[table] || 0) + 1;
        }
      }

      return stats;
    } catch (error: any) {
      console.error("[cache] Error getting stats:", error);
      return { error: error.message };
    }
  }
}
