import { PoolClient } from "pg";
import { Context } from "../../types";
import { PlatformService } from "../types";

export type TableDefinition = {
  name: string;
  columns: { [key: string]: string };
  pk: string[];
  indexes?: (string | string[])[];
  auditable?: boolean;
  rest?: {
    searchable?: (object: any) => string | string[];
    label?: string | ((object: any) => string);
    hidden?: string[];
    schema?: Schema;
  };
};

type SchemaTypes = "text" | "number" | "boolean" | "date" | string;

type Schema = {
  [key: string]: Schema | SchemaTypes | SchemaTypes[] | Schema[];
};

export type RestTableDefinition = TableDefinition & {
  columns: { [key: string]: string; client_id: string; id: string };
};

export type TransactionExecutor = { id: string; client: PoolClient };

export type Condition<T> =
  | { where: string; values: any[] }
  | { sql: string; values: any[] }
  | Partial<T>
  | {
      [key: string]: string | string[];
    };

export type DbTableIndex = [string, "number" | "string"][];

export type DbComparators = ">" | "<" | "=" | "<=" | ">=" | "begins_with";

export type TransactionOperation<Entity> = {
  operation: "insert" | "update" | "delete";
  ctx: Context;
  table: string;
  document: Entity;
  condition: Condition<Entity>;
};

export interface DbAdapterInterface extends PlatformService {
  createTable(definition: TableDefinition): Promise<void>;

  getTablesDefinitions(): { [key: string]: TableDefinition };

  custom<T>(ctx: Context, sql: string, values: any[]): Promise<T>;

  insert<Entity>(
    ctx: Context,
    table: string,
    document: Entity,
    options?: { triggers?: boolean }
  ): Promise<void>;

  update<Entity>(
    ctx: Context,
    table: string,
    condition: Condition<Entity>,
    document: Partial<Entity>,
    options?: { triggers?: boolean }
  ): Promise<void>;

  select<Entity>(
    ctx: Context,
    table: string,
    condition: Condition<Entity>,
    options?: {
      comparator?: DbComparators;
      limit?: number;
      offset?: number;
      asc?: boolean;
      index?: string;
      include_deleted?: boolean;
      rank_query?: string;
    }
  ): Promise<Entity[]>;

  count<Entity>(
    ctx: Context,
    table: string,
    condition: Condition<Entity>,
    options?: { include_deleted?: boolean }
  ): Promise<number>;

  selectOne<Entity>(
    ctx: Context,
    table: string,
    condition: Condition<Entity>,
    options?: {
      ignoreSingleCheck?: boolean;
      index?: string;
      retry?: number;
      include_deleted?: boolean;
    }
  ): Promise<Entity>;

  delete<Entity>(
    ctx: Context,
    table: string,
    condition: Condition<Entity>,
    options?: { ignoreSingleCheck?: boolean }
  ): Promise<void>;

  transaction<T>(
    ctx: Context,
    executor: (ctx: Context) => Promise<T>
  ): Promise<T>;
}
