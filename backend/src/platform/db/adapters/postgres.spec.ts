import { describe, expect, jest, test } from "@jest/globals";

jest.mock("../..", () => ({
  __esModule: true,
  default: { TriggersManager: { registerEntities: jest.fn() } },
}));
jest.mock("#src/services/rest/services/rest", () => ({ preHook: jest.fn() }));
jest.mock("@sentry/node", () => ({ captureException: jest.fn() }));
jest.mock("../../logger-db", () => ({ Logger: class {} }));

import DbPostgres from "./postgres";

const insertedRow = async (columns: Record<string, string>, document: any) => {
  const query = jest.fn<(...args: any[]) => Promise<any>>();
  const db = Object.assign(Object.create(DbPostgres.prototype), {
    tablesDefinitions: { things: { columns } },
    prehooks: {},
    client: {},
    logger: { info: jest.fn() },
    query,
  });

  await db.insert({}, "things", document, { triggers: false });

  const [, , sql, values] = query.mock.calls[0];
  const names = (sql as string).match(/\(([^)]+)\) VALUES/)?.[1].split(", ");
  return Object.fromEntries(names.map((name, i) => [name, values[i]]));
};

describe("DbPostgres.insert", () => {
  const columns = { id: "VARCHAR(64)", is_deleted: "BOOLEAN" };

  test("a row without is_deleted is not deleted", async () => {
    expect(await insertedRow(columns, { id: "a" })).toEqual({
      id: "a",
      is_deleted: false,
    });
    expect(
      await insertedRow(columns, { id: "a", is_deleted: null })
    ).toEqual({ id: "a", is_deleted: false });
  });

  test("an explicit value is kept", async () => {
    expect(
      await insertedRow(columns, { id: "a", is_deleted: true })
    ).toEqual({ id: "a", is_deleted: true });
  });

  test("tables without is_deleted are not changed", async () => {
    expect(await insertedRow({ id: "VARCHAR(64)" }, { id: "a" })).toEqual({
      id: "a",
    });
  });
});

describe("DbPostgres.createTable", () => {
  const createdQueries = async (columns: Record<string, string>) => {
    const query = jest.fn<(...args: any[]) => Promise<any>>(
      async () => ({ rows: [], rowCount: 0 })
    );
    const db = Object.assign(Object.create(DbPostgres.prototype), {
      tablesDefinitions: {},
      prehooks: {},
      client: {},
      logger: { info: jest.fn() },
      query,
    });
    await db.createTable({ name: "things", pk: ["id"], columns });
    return query.mock.calls.map((call) => call[2] as string);
  };

  test("rows left without is_deleted are repaired and it defaults to false", async () => {
    const queries = await createdQueries({
      id: "VARCHAR(64)",
      is_deleted: "BOOLEAN",
    });
    expect(queries).toContain(
      "ALTER TABLE things ALTER COLUMN is_deleted SET DEFAULT false"
    );
    expect(queries).toContain(
      "UPDATE things SET is_deleted = false WHERE is_deleted IS NULL"
    );
  });

  test("tables without is_deleted are not changed", async () => {
    const queries = await createdQueries({ id: "VARCHAR(64)" });
    expect(queries.some((q) => q.includes("is_deleted"))).toBe(false);
  });
});
