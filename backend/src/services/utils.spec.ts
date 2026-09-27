import { describe, expect, test } from "@jest/globals";
import { formatDateInTimezone } from "./utils";

describe("formatDateInTimezone", () => {
  test("formats in the given timezone", () => {
    // 2026-03-01 00:00 in Europe/Paris
    const date = new Date("2026-02-28T23:00:00.000Z").getTime();
    expect(formatDateInTimezone(date, "Europe/Paris")).toBe("2026-03-01");
    expect(formatDateInTimezone(date, "UTC")).toBe("2026-02-28");
  });

  test("falls back on Europe/Paris for an unknown timezone", () => {
    const date = new Date("2026-02-28T23:00:00.000Z");
    expect(formatDateInTimezone(date, "Not/AZone")).toBe("2026-03-01");
  });

  test("throws on an invalid date", () => {
    expect(() => formatDateInTimezone("not a date", "Europe/Paris")).toThrow();
  });
});
