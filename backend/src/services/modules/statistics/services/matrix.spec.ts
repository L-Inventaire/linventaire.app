import { describe, expect, test } from "@jest/globals";
import { getMonthBounds } from "./matrix";

describe("Statistics matrix", () => {
  test("getMonthBounds", async () => {
    const bounds = (month: string) => {
      const { from, to } = getMonthBounds(month, "Europe/Paris");
      return [new Date(from).toISOString(), new Date(to).toISOString()];
    };

    expect(bounds("2026-02")).toEqual([
      "2026-01-31T23:00:00.000Z",
      "2026-02-28T23:00:00.000Z",
    ]);
    // DST change during the month: must end on April 1st at 00:00 (Paris)
    expect(bounds("2026-03")).toEqual([
      "2026-02-28T23:00:00.000Z",
      "2026-03-31T22:00:00.000Z",
    ]);
    expect(bounds("2026-04")).toEqual([
      "2026-03-31T22:00:00.000Z",
      "2026-04-30T22:00:00.000Z",
    ]);
    expect(bounds("2026-10")).toEqual([
      "2026-09-30T22:00:00.000Z",
      "2026-10-31T23:00:00.000Z",
    ]);
  });
});
