import { describe, expect, test } from "@jest/globals";
import { isApiRequest, parseCreatedAt, parseSourceId } from "./rest";

describe("REST writes from API clients", () => {
  test("only API keys sending a REST request may set source_id and created_at", () => {
    expect(isApiRequest({ role: "API" } as any, { fromRequest: true })).toBe(
      true
    );
    // User interface
    expect(isApiRequest({ role: "USER" } as any, { fromRequest: true })).toBe(
      false
    );
    // Documents created by the server during an API request (ex. invoice from a quote)
    expect(isApiRequest({ role: "API" } as any)).toBe(false);
    expect(isApiRequest({ role: "API" } as any, {})).toBe(false);
  });

  test("source_id", () => {
    expect(parseSourceId(" nkcli12 ")).toBe("nkcli12");
    expect(parseSourceId(42)).toBe("42");
    expect(parseSourceId("")).toBe(null);
    expect(parseSourceId(null)).toBe(null);
    expect(parseSourceId(undefined)).toBe(null);
    expect(() => parseSourceId({ id: 1 })).toThrow();
    expect(() => parseSourceId("x".repeat(256))).toThrow();
  });

  test("created_at accepts timestamps and ISO dates in the past", () => {
    expect(parseCreatedAt(1104577200000)).toBe(1104577200000);
    expect(parseCreatedAt("1104577200000")).toBe(1104577200000);
    expect(parseCreatedAt("2005-01-01T11:00:00Z")).toBe(1104577200000);
    expect(() => parseCreatedAt("not a date")).toThrow();
    expect(() => parseCreatedAt(0)).toThrow();
    expect(() => parseCreatedAt(Date.now() + 24 * 3600 * 1000)).toThrow();
  });
});
