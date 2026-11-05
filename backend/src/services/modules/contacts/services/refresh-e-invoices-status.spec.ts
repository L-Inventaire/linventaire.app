import { beforeEach, describe, expect, jest, test } from "@jest/globals";

const update = jest.fn<any>();
const getService = jest.fn(async () => ({ update }));
const getFrenchDirectoryEntries = jest.fn<any>();
const searchFrenchDirectoryCompanies = jest.fn<any>();

jest.mock("#src/platform/index", () => ({
  __esModule: true,
  default: {
    Db: { getService },
    LoggerDb: { get: () => ({ error: jest.fn() }) },
  },
}));

jest.mock("./french-directory", () => ({
  getFrenchDirectoryEntries,
  searchFrenchDirectoryCompanies,
}));

import {
  findEInvoicesEntry,
  needsEInvoicesStatusRefresh,
  refreshContactEInvoicesStatus,
  resetEInvoicesStatusRefreshCooldown,
} from "./refresh-e-invoices-status";

const ctx = { client_id: "cl-1", id: "us-1", role: "USER" } as any;
const contact = (extra: any = {}) =>
  ({
    id: "co-1",
    client_id: "cl-1",
    type: "company",
    address: { country: "FR" },
    business_registered_id: "39150621900012",
    e_invoices_identifier: "0225:39150621900012",
    e_invoices_active: false,
    ...extra,
  } as any);
const entry = (identifier: string, is_active: boolean) => ({
  identifier,
  is_active,
  company: { number: "391506219" },
});

beforeEach(() => {
  update.mockReset();
  getFrenchDirectoryEntries.mockReset();
  searchFrenchDirectoryCompanies.mockReset();
  resetEInvoicesStatusRefreshCooldown();
});

describe("needsEInvoicesStatusRefresh", () => {
  test("a French company with a SIREN not active is checked", () => {
    expect(needsEInvoicesStatusRefresh(contact())).toBe(true);
    expect(
      needsEInvoicesStatusRefresh(contact({ e_invoices_identifier: "" }))
    ).toBe(true);
  });

  test("an active contact, without SIREN, abroad or a person is not", () => {
    expect(
      needsEInvoicesStatusRefresh(contact({ e_invoices_active: true }))
    ).toBe(false);
    expect(
      needsEInvoicesStatusRefresh(contact({ business_registered_id: "" }))
    ).toBe(false);
    expect(
      needsEInvoicesStatusRefresh(contact({ address: { country: "BE" } }))
    ).toBe(false);
    expect(needsEInvoicesStatusRefresh(contact({ type: "person" }))).toBe(
      false
    );
  });
});

describe("findEInvoicesEntry", () => {
  test("the active entry of the registration number", async () => {
    getFrenchDirectoryEntries.mockResolvedValue([
      entry("0225:391506219_1", false),
      entry("0225:391506219", true),
    ]);
    expect((await findEInvoicesEntry(ctx, "391 506 219"))?.identifier).toBe(
      "0225:391506219"
    );
    expect(searchFrenchDirectoryCompanies).not.toHaveBeenCalled();
  });

  test("otherwise searched by SIREN, a single company is taken", async () => {
    getFrenchDirectoryEntries.mockImplementation(async (_ctx: any, n: string) =>
      n === "391506219" ? [entry("0225:391506219", true)] : []
    );
    searchFrenchDirectoryCompanies.mockResolvedValue({
      data: [{ number: "391506219" }],
    });

    const found = await findEInvoicesEntry(ctx, "39150621900012");
    expect(searchFrenchDirectoryCompanies).toHaveBeenCalledWith(ctx, {
      number: "391506219",
      limit: 2,
    });
    expect(found).toMatchObject({
      identifier: "0225:391506219",
      is_active: true,
    });
  });

  test("several companies found: none is taken", async () => {
    getFrenchDirectoryEntries.mockResolvedValue([]);
    searchFrenchDirectoryCompanies.mockResolvedValue({
      data: [{ number: "391506219" }, { number: "391506218" }],
    });
    expect(await findEInvoicesEntry(ctx, "39150621900012")).toBeNull();
    expect(getFrenchDirectoryEntries).toHaveBeenCalledTimes(1);
  });
});

describe("refreshContactEInvoicesStatus", () => {
  test("saves the contact once found active", async () => {
    getFrenchDirectoryEntries.mockResolvedValue([
      entry("0225:391506219", true),
    ]);

    const result = await refreshContactEInvoicesStatus(ctx, contact());

    expect(result.e_invoices_active).toBe(true);
    expect(update.mock.calls[0][3]).toEqual({
      e_invoices_identifier: "0225:391506219",
      e_invoices_active: true,
    });
  });

  test("not found: nothing changes, a failure never clears it", async () => {
    getFrenchDirectoryEntries.mockRejectedValue(new Error("down"));
    const result = await refreshContactEInvoicesStatus(ctx, contact());
    expect(result).toEqual(contact());
    expect(update).not.toHaveBeenCalled();
  });

  test("the directory is called once per contact in a while", async () => {
    getFrenchDirectoryEntries.mockResolvedValue([]);
    searchFrenchDirectoryCompanies.mockResolvedValue({ data: [] });

    await refreshContactEInvoicesStatus(ctx, contact());
    await refreshContactEInvoicesStatus(ctx, contact());
    expect(getFrenchDirectoryEntries).toHaveBeenCalledTimes(1);

    await refreshContactEInvoicesStatus(ctx, contact(), { force: true });
    expect(getFrenchDirectoryEntries).toHaveBeenCalledTimes(2);
  });
});
