import { describe, expect, test } from "@jest/globals";
import { getRequestIp } from "./utils";

const req = (remoteAddress: string, xff?: string) =>
  ({
    headers: xff ? { "x-forwarded-for": xff } : {},
    socket: { remoteAddress },
  } as any);

const trustPrivate = (addr: string) => /^(127\.|10\.|::1$)/.test(addr);

describe("getRequestIp", () => {
  test("uses the socket address when no proxy is trusted", () => {
    expect(getRequestIp(req("10.0.0.1", "1.2.3.4"), () => false)).toBe(
      "10.0.0.1"
    );
    expect(getRequestIp(req("10.0.0.1", "1.2.3.4"), null)).toBe("10.0.0.1");
  });

  test("uses X-Forwarded-For behind a trusted proxy", () => {
    expect(getRequestIp(req("10.0.0.1", "1.2.3.4"), trustPrivate)).toBe(
      "1.2.3.4"
    );
  });

  test("does not trust spoofed addresses before an untrusted hop", () => {
    expect(
      getRequestIp(req("10.0.0.1", "6.6.6.6, 1.2.3.4, 10.0.0.2"), trustPrivate)
    ).toBe("1.2.3.4");
  });

  test("falls back to the socket address without header", () => {
    expect(getRequestIp(req("1.2.3.4"), trustPrivate)).toBe("1.2.3.4");
  });
});
