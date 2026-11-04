import { describe, expect, jest, test } from "@jest/globals";

const mockInsert = jest.fn<(...args: any[]) => Promise<void>>();
jest.mock("#src/platform/index", () => ({
  __esModule: true,
  default: {
    Db: {
      getService: async () => ({
        select: async () => [],
        insert: mockInsert,
      }),
    },
    TriggersManager: {
      getEntities: () => ({
        tags: { columns: { client_id: "VARCHAR(64)" }, pk: ["client_id", "id"] },
      }),
    },
  },
}));

const mockUpdateClient = jest.fn<(...args: any[]) => Promise<void>>();
jest.mock("#src/services/clients/services/client", () => ({
  updateClient: mockUpdateClient,
}));

import { importData } from "./import";

const ctx = { client_id: "cl-1", id: "user-1", role: "USER" } as any;

describe("importData", () => {
  test("company settings update the current company, without secrets", async () => {
    const result = await importData(ctx, {
      clients: [
        {
          id: "another-company",
          company: { registration_number: "12345678900017" },
          smtp: { host: "evil" },
        },
      ],
    });

    expect(result.clients).toEqual({ imported: 1, skipped: 0, errors: [] });
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockUpdateClient).toHaveBeenCalledWith(ctx, "cl-1", {
      company: { registration_number: "12345678900017" },
    });
  });

  test("imported records are visible and have an author", async () => {
    const result = await importData(ctx, {
      tags: [{ client_id: "other", id: "t1", name: "Tag", is_deleted: true }],
    });

    expect(result.tags).toEqual({ imported: 1, skipped: 0, errors: [] });
    expect(mockInsert.mock.calls[0][2]).toMatchObject({
      client_id: "cl-1",
      id: "t1",
      is_deleted: false,
      created_by: "user-1",
      updated_by: "user-1",
    });
  });
});
