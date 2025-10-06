import { RestEntity } from "#src/services/rest/entities/entity";
import { preHook } from "#src/services/rest/services/rest";
import fs from "fs";
import _ from "lodash";
import { Pool, PoolClient } from "pg";
import { v4 } from "uuid";
import Framework from "../..";
import { Context } from "../../../types";
import { Logger } from "../../logger-db";
import {
  Condition,
  DbAdapterInterface,
  DbComparators,
  TableDefinition,
} from "../api";
import { getWhereClause } from "../utils";

export type ClientConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
};

export default class DbPostgres implements DbAdapterInterface {
  private client: PoolClient;
  private pool: Pool;
  private logger: Logger;
  private debug = true;
  private tablesDefinitions: { [key: string]: TableDefinition } = {};
  private prehooks: {
    [key: string]: (e: RestEntity, p?: RestEntity) => RestEntity;
  } = {};

  constructor(private database: string, private config: ClientConfig) {}

  getTablesDefinitions() {
    return this.tablesDefinitions;
  }

  async init() {
    const dbConfig = {
      ...this.config,
      database: this.database,
      connectionTimeoutMillis: 30000, // connexion initiale (30 secondes)
      idleTimeoutMillis: 30000, // durée max d'inactivité (30 secondes)
      max: 10, // Ajustez selon vos besoins
      ...(this.config.host.includes("rds.amazonaws.com")
        ? {
            ssl: {
              requestCert: true,
              rejectUnauthorized: true,
              ca: fs
                .readFileSync(
                  __dirname + "/../../../../assets/ca/eu-west-3-bundle.pem"
                )
                .toString(),
            },
          }
        : {}),
    };

    this.logger = Framework.LoggerDb.get("db-postgres");
    this.pool = new Pool(dbConfig);
    this.client = await this.pool.connect();
    try {
      await this.query(null, this.client, `CREATE DATABASE ${this.database}`);
    } catch (e) {
      this.logger.info(null, `Database ${this.database} already exists`);
    }
    this.client.release();
    this.pool = new Pool(dbConfig);
    this.client = await this.pool.connect();
    this.logger.info(null, `Connected to database ${this.database}`);

    //Extensions
    this.client.query(`CREATE EXTENSION IF NOT EXISTS unaccent;`);
    this.client.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
    this.client.query(`CREATE EXTENSION IF NOT EXISTS btree_gist;`);
    this.client
      .query(`CREATE OR REPLACE FUNCTION immutable_unaccent(text) RETURNS text AS $$
    SELECT unaccent($1);
    $$ LANGUAGE SQL IMMUTABLE;`);

    setInterval(() => {
      this.client
        .query("SELECT now()")
        .catch((err) => console.error("Keep-Alive Error:", err));
    }, 60000); // Toutes les 60 secondes

    return this;
  }

  async query(
    ctx: Context,
    client: PoolClient,
    queryText: string,
    values?: any[]
  ) {
    const start = Date.now();
    try {
      return await client.query(queryText, values);
    } finally {
      const end = Date.now();
      this.logger.info(
        ctx,
        `[${queryText}] ${end - start}ms`,
        this.debug ? values : null
      );
    }
  }

  async createTable(definition: TableDefinition) {
    const {
      name,
      pk,
      indexes,
      columns: keyValueColumns,
      auditable,
    } = definition;

    this.prehooks[name] = (document: RestEntity, prevDocument?: RestEntity) =>
      preHook(name, document, prevDocument);
    this.tablesDefinitions[name] = definition;
    this.tablesDefinitions[name + "_history"] = definition;
    this.tablesDefinitions[name + "_history"].columns.operation = "VARCHAR(16)";
    this.tablesDefinitions[name + "_history"].columns.operation_timestamp =
      "BIGINT";

    Framework.TriggersManager.registerEntities([definition]);

    const columns = Object.entries(keyValueColumns).map(([name, type]) => ({
      name,
      type,
    }));

    // Construct columns SQL
    const columnsSql = columns
      .map((col) => `${col.name} ${col.type}`)
      .join(", ");

    // Construct primary key SQL
    const primaryKeySql = `PRIMARY KEY (${pk.join(", ")})`;

    // Initial table creation SQL
    const createTableSql = `CREATE TABLE IF NOT EXISTS ${name} (${columnsSql}, ${primaryKeySql})`;

    await this.query(null, this.client, createTableSql);

    // Check and update column types if needed
    for (const col of columns) {
      try {
        await this.query(
          null,
          this.client,
          `ALTER TABLE ${name} ADD COLUMN ${col.name} ${col.type}`
        );
      } catch (error) {
        console.log(error.message);
        if (error.message.includes("column")) {
          // If the column exists, try updating its type (this may fail if there are incompatible data types)
          try {
            await this.query(
              null,
              this.client,
              `ALTER TABLE ${name} ALTER COLUMN ${col.name} TYPE ${col.type}`
            );
          } catch (typeError) {
            this.logger.info(
              null,
              `Couldn't update column type for ${col.name} in ${name}. Reason: ${typeError.message}`
            );
          }
        }
      }
    }

    // Create additional indexes
    if (indexes) {
      for (const indexDef of indexes) {
        if (typeof indexDef === "object") {
          const indexColumns = indexDef;
          const indexName = `${name}_${indexColumns.join("_")}_idx`;
          const createIndexSql = `CREATE INDEX IF NOT EXISTS ${indexName} ON ${name} (${indexColumns.join(
            ", "
          )})`;
          await this.query(null, this.client, createIndexSql);
        } else {
          const indexName = `${name}_${indexDef
            .toLocaleLowerCase()
            .replace(/[^a-z]/gm, "_")
            .replace(/_+/gm, "_")}_idx`;
          const createIndexSql = `CREATE INDEX IF NOT EXISTS ${indexName} ON ${name} ${indexDef}`;
          await this.query(null, this.client, createIndexSql);
        }
      }
    }

    // History table creation
    if (auditable) {
      const historyColumnsSql = columns
        .map((col) => `${col.name} ${col.type}`)
        .join(", ");

      const createHistoryTableSql = `CREATE TABLE IF NOT EXISTS ${name}_history (${historyColumnsSql})`;

      await this.query(null, this.client, createHistoryTableSql);

      for (const col of columns) {
        try {
          await this.query(
            null,
            this.client,
            `ALTER TABLE ${name}_history ADD COLUMN ${col.name} ${col.type}`
          );
        } catch (error) {
          if (error.message.includes("column")) {
            // If the column exists in the history table, try updating its type
            try {
              await this.query(
                null,
                this.client,
                `ALTER TABLE ${name}_history ALTER COLUMN ${col.name} TYPE ${col.type}`
              );
            } catch (typeError) {
              this.logger.info(
                null,
                `Couldn't update column type for ${col.name} in ${name}_history. Reason: ${typeError.message}`
              );
            }
          }
        }
      }
    }

    this.logger.info(null, `Table ${name} has been set up or updated.`);
  }

  async insert<Entity>(
    ctx: Context,
    table: string,
    document: Entity,
    options: {
      triggers?: boolean;
    }
  ) {
    const cols = this.tablesDefinitions[table]?.columns || {};

    const generatedCols = Object.entries(cols)
      .filter(([_, type]) => type.includes("GENERATED"))
      .map(([name, _]) => name);
    document = _.omit(document as any, generatedCols) as Entity;

    // Execute prehook function
    if (this.prehooks[table]) {
      document = this.prehooks[table](document as RestEntity) as Entity;
    }

    // Make sure dates are sent as numbers
    for (const type of Object.keys(cols)) {
      if (cols[type] === "BIGINT") {
        if (document[type]) {
          document[type] = new Date(document[type]).getTime();
        }
      }
      if (
        (cols[type] === "TEXT" || cols[type].includes("VARCHAR")) &&
        !cols[type].includes("[]") &&
        !document[type]
      ) {
        document[type] = "";
      }
      // Null values are bad for postgres
      if (cols[type] === "BOOLEAN" && document[type] !== undefined) {
        // The key must still be present as it's an update
        document[type] = !!document[type];
      }
    }

    const client = ctx.db_tnx?.client || this.client;
    const columns = Object.keys(document);
    const values = Object.values(document);
    const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(",");

    const queryText = `INSERT INTO ${table} (${columns.join(
      ", "
    )}) VALUES (${placeholders})`;

    await this.query(ctx, client, queryText, values);
    this.logger.info(ctx, `Inserted document into ${table}`);

    if (options?.triggers !== false) {
      await Framework.TriggersManager.trigger(ctx, table, document, null);
    }
  }

  async update<Entity>(
    ctx: Context,
    table: string,
    condition: Condition<Entity>,
    document: Entity,
    options: {
      triggers?: boolean;
    }
  ) {
    const cols = this.tablesDefinitions[table]?.columns || {};

    const generatedCols = Object.entries(cols)
      .filter(([_, type]) => type.includes("GENERATED"))
      .map(([name, _]) => name);
    document = _.omit(document as any, generatedCols) as Entity;

    const previousDocument = await this.selectOne(ctx, table, condition, {
      include_deleted: true,
    });

    // Execute prehook function
    if (this.prehooks[table]) {
      document = this.prehooks[table](
        document as RestEntity,
        _.cloneDeep(previousDocument as RestEntity)
      ) as Entity;
    }

    // Make sure dates are sent as numbers
    for (const type of Object.keys(cols)) {
      if (cols[type] === "BIGINT") {
        if (document[type]) {
          document[type] = new Date(document[type]).getTime();
        }
      }
      if (
        (cols[type] === "TEXT" || cols[type].includes("VARCHAR")) &&
        !cols[type].includes("[]") &&
        typeof document[type] !== "string" &&
        !document[type]
      ) {
        delete document[type];
      }
      // Null values are bad for postgres
      if (cols[type] === "BOOLEAN" && document[type] !== undefined) {
        // The key must still be present as it's an update (or every updates will set the value to false if key is not present)
        document[type] = !!document[type];
      }
    }

    if (cols["operation_timestamp"]) {
      document["operation_timestamp"] = Date.now();
    }

    const client = ctx.db_tnx?.client || this.client;
    const updates = Object.keys(document)
      .map((key, idx) => `${key} = $${idx + 1}`)
      .join(", ");
    const values = Object.values(document);

    const { clause: whereClause, values: newValues } = getWhereClause(
      condition,
      values.length
    );
    values.push(...newValues);

    const queryText = `UPDATE ${table} SET ${updates} ${whereClause}`;
    await this.query(ctx, client, queryText, values);
    this.logger.info(
      ctx,
      `Updated document in ${table} with condition ${JSON.stringify(condition)}`
    );

    if (options?.triggers !== false) {
      await Framework.TriggersManager.trigger(
        ctx,
        table,
        { ...previousDocument, ...document },
        previousDocument
      );
    }
  }

  async delete<Entity>(
    ctx: Context,
    table: string,
    condition: Condition<Entity>,
    options?: { ignoreSingleCheck?: boolean }
  ) {
    const previousDocument = await this.selectOne(ctx, table, condition, {
      ignoreSingleCheck: options?.ignoreSingleCheck,
    });

    const client = ctx.db_tnx?.client || this.client;
    const { clause: whereClause, values } = getWhereClause(condition);

    if (whereClause === "") {
      throw new Error("Delete without condition is not allowed");
    }

    const queryText = `DELETE FROM ${table} ${whereClause}`;
    await this.query(ctx, client, queryText, values);
    this.logger.info(
      ctx,
      `Deleted from ${table} with condition ${JSON.stringify(condition)}`
    );

    if (previousDocument) {
      await Framework.TriggersManager.trigger(
        ctx,
        table,
        null,
        previousDocument
      );
    }
  }

  async select<Entity>(
    ctx: Context,
    table: string,
    condition: Condition<Entity>,
    options: {
      comparator?: DbComparators;
      limit?: number;
      offset?: number;
      asc?: boolean;
      index?: string;
      count?: boolean;
      include_deleted?: boolean;
      rank_query?: string;
    } = {
      comparator: "=",
      limit: 100,
      asc: true,
      include_deleted: false,
    }
  ) {
    options.asc = options.asc !== false; // Default to true if not specified

    const client = ctx.db_tnx?.client || this.client;
    const cols = this.tablesDefinitions[table]?.columns || {};

    // If is_deleted columns exists, by default we filter out deleted records
    if (
      !options.include_deleted &&
      (condition as any).is_deleted === undefined &&
      !(condition as any).where &&
      !(condition as any).sql &&
      cols.is_deleted
    ) {
      (condition as any).is_deleted = false;
    }

    if (
      ctx.role === "SYSTEM" &&
      (condition as any).sql &&
      (condition as any).values
    ) {
      const result = await this.query(
        ctx,
        client,
        (condition as any).sql,
        (condition as any).values
      );
      return result.rows as Entity[];
    }

    if (ctx.role !== "SYSTEM" && (condition as any).where) {
      delete (condition as any).where;
      delete (condition as any).sql;
    }

    const { clause: whereClause, values } = getWhereClause(condition);

    const limitClause =
      (options.limit ? `LIMIT ${parseInt(options.limit as any)}` : "") +
      " " +
      (options.offset ? `OFFSET ${parseInt(options.offset as any)}` : "");

    let orderClause =
      options.index && !options.count
        ? `ORDER BY id ${options.asc ? "ASC" : "DESC"}`
        : "";
    if (options.index && !options.count) {
      const indexes = options.index
        .split(",")
        .map((a) =>
          a.split(" ").map((b) => b.trim().replace(/(;|"| )/gim, ""))
        );
      orderClause = `ORDER BY ${indexes
        .map(
          (a) =>
            `${a[0]} ${
              options.asc
                ? a[1] || "asc"
                : a[1]?.toLocaleLowerCase() === "desc"
                ? "asc"
                : "desc"
            }`
        )
        .join(", ")}`;
    }

    let select = !options.count
      ? "SELECT *, 1 as _rank"
      : "SELECT count(*) as total";
    if (
      options?.index?.split(",").indexOf("_rank") !== -1 &&
      !options?.count &&
      options?.rank_query
    ) {
      // In this case add this to select:
      // ts_rank_cd(searchable_generated, plainto_tsquery('$searchQuery')) AS rank
      select = `SELECT *, ts_rank_cd(searchable_generated, plainto_tsquery('simple', $${
        values.length + 1
      })) AS _rank`;
      values.push(options?.rank_query);
    }

    const queryText = `${select} FROM ${table} ${whereClause} ${orderClause} ${limitClause}`;
    const result = await this.query(ctx, client, queryText, values);

    // Convert back dates to numbers instead of strings
    for (const type of Object.keys(cols)) {
      if (cols[type] === "BIGINT") {
        result.rows.forEach((row: any) => {
          if (row[type] && typeof row[type] === "string") {
            row[type] = parseInt(row[type]);
          }
        });
      }
    }

    return result.rows as Entity[];
  }

  async count<Entity>(
    ctx: Context,
    table: string,
    condition: Condition<Entity>,
    opt = { include_deleted: false }
  ) {
    const tmp = await this.select<Entity>(ctx, table, condition, {
      count: true,
      include_deleted: opt.include_deleted,
    });
    return parseInt(tmp[0]["total"]);
  }

  async selectOne<Entity>(
    ctx: Context,
    table: string,
    condition: Condition<Entity>,
    options?: {
      ignoreSingleCheck?: boolean;
      index?: string;
      include_deleted?: boolean;
    }
  ) {
    const list = await this.select<Entity>(ctx, table, condition, {
      index: options?.index,
      include_deleted: options?.include_deleted,
    });

    if (!list || list.length === 0) return null;
    if (list.length > 1 && !options?.ignoreSingleCheck) {
      throw new Error("Multiple results found when only 1 was expected");
    }

    return list[0];
  }

  async transaction<T>(
    ctx: Context,
    executor: (ctx: Context) => Promise<T>
  ): Promise<T> {
    const tnx = ctx.db_tnx || { id: v4(), client: await this.pool.connect() };
    try {
      await tnx.client.query("BEGIN");
      const res = await executor({ ...ctx, db_tnx: tnx });
      await tnx.client.query("COMMIT");
      return res;
    } catch (e) {
      await tnx.client.query("ROLLBACK");
      this.logger.info(ctx, "ROLLBACK transaction " + e.message);
      throw e;
    } finally {
      if (!ctx.db_tnx) tnx.client.release();
    }
  }

  async custom(ctx: Context, sql: string, values: any[]): Promise<any> {
    return this.query(ctx, this.client, sql, values);
  }
}
