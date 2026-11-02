import { describe, expect, test } from "@jest/globals";
import { id } from "./utils";

const decode = (value: string) =>
  [...value].reduce(
    (acc, c) => acc * BigInt(36) + BigInt(parseInt(c, 36)),
    BigInt(0)
  );

describe("id", () => {
  test("never repeats, even when many ids are created in the same millisecond", () => {
    const ids = Array.from({ length: 200000 }, () => id());
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("ids sort by creation date, with the same format as before", () => {
    const ids = Array.from({ length: 1000 }, () => id());
    expect([...ids].sort()).toEqual(ids);
    for (const value of ids) expect(value).toMatch(/^[0-9a-z]{12}$/);

    // Same scale as the existing ids: milliseconds × 1 000 000
    const ms = Number(decode(ids[0]) / BigInt(1000000));
    expect(Math.abs(ms - Date.now())).toBeLessThan(60 * 1000);
    expect(ids[0] > "dmkn9flb9a80").toBe(true);
  });

  test("the last digits are not rounded anymore", () => {
    const lastChars = new Set(
      Array.from({ length: 1000 }, () => id().slice(-1))
    );
    expect(lastChars.size).toBeGreaterThan(10);
  });
});
