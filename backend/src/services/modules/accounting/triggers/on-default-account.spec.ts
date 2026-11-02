import { beforeEach, describe, expect, jest, test } from "@jest/globals";

const mockRegistered: any[] = [];
const select = jest.fn<(...args: any[]) => Promise<any[]>>();
const update = jest.fn<(...args: any[]) => Promise<void>>();
jest.mock("../../../../platform", () => ({
  __esModule: true,
  default: {
    TriggersManager: {
      registerTrigger: (_entity: any, options: any) =>
        mockRegistered.push(options),
    },
    Db: { getService: async () => ({ select, update }) },
  },
}));

import { setOnDefaultAccountTrigger } from "./on-default-account";

setOnDefaultAccountTrigger();
const [trigger] = mockRegistered;
const ctx = { client_id: "cl-1", role: "USER" } as any;

describe("default bank account", () => {
  beforeEach(() => {
    select.mockReset();
    update.mockReset();
  });

  test("runs when an internal account becomes the default one", () => {
    const bank = { id: "a", type: "internal", is_default: true };
    expect(trigger.test(ctx, bank, null)).toBe(true);
    expect(trigger.test(ctx, bank, { ...bank, is_default: false })).toBe(true);
    // Already the default one, or not a bank/cash account
    expect(trigger.test(ctx, bank, bank)).toBe(false);
    expect(trigger.test(ctx, { ...bank, type: "client" }, null)).toBe(false);
    expect(trigger.test(ctx, { ...bank, is_default: false }, null)).toBe(false);
  });

  test("the other default accounts are unset", async () => {
    select.mockResolvedValue([
      { id: "a", is_default: true },
      { id: "filemaker", is_default: true },
    ]);
    await trigger.callback(ctx, {
      id: "a",
      client_id: "cl-1",
      type: "internal",
      is_default: true,
    });
    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0][2]).toEqual({
      client_id: "cl-1",
      id: "filemaker",
    });
    expect(update.mock.calls[0][3]).toEqual({ is_default: false });
  });
});
