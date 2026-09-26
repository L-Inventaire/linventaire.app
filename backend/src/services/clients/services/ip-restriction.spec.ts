import { describe, expect, it } from "@jest/globals";
import { isIpAllowed, parseIpEntry, sanitizeSecurity } from "./ip-restriction";

describe("IP restriction", () => {
  it("parses and validates entries", () => {
    expect(parseIpEntry(" 1.2.3.4 ")).toBe("1.2.3.4");
    expect(parseIpEntry("10.0.0.0/8")).toBe("10.0.0.0/8");
    expect(parseIpEntry("2001:db8::/32")).toBe("2001:db8::/32");
    expect(parseIpEntry("::ffff:1.2.3.4")).toBe("1.2.3.4");
    expect(parseIpEntry("1.2.3.4/33")).toBeNull();
    expect(parseIpEntry("1.2.3")).toBeNull();
    expect(parseIpEntry("hello")).toBeNull();
    expect(parseIpEntry("1.2.3.4/24/1")).toBeNull();
  });

  it("matches single IPs and CIDR ranges", () => {
    const list = ["1.2.3.4", "10.0.0.0/8", "2001:db8::/32"];
    expect(isIpAllowed("1.2.3.4", list)).toBe(true);
    expect(isIpAllowed("::ffff:1.2.3.4", list)).toBe(true);
    expect(isIpAllowed("1.2.3.5", list)).toBe(false);
    expect(isIpAllowed("10.20.30.40", list)).toBe(true);
    expect(isIpAllowed("2001:db8:1::1", list)).toBe(true);
    expect(isIpAllowed("2001:db9::1", list)).toBe(false);
    expect(isIpAllowed(undefined, list)).toBe(false);
    expect(isIpAllowed("1.2.3.4", [])).toBe(false);
  });

  it("sanitizes security settings", () => {
    expect(
      sanitizeSecurity({
        ip_restriction: {
          enabled: true,
          allowed_ips: ["1.2.3.4", " 1.2.3.4", "10.0.0.0/8"],
        },
      })
    ).toEqual({
      ip_restriction: { enabled: true, allowed_ips: ["1.2.3.4", "10.0.0.0/8"] },
    });
    expect(() =>
      sanitizeSecurity({
        ip_restriction: { enabled: true, allowed_ips: ["nope"] },
      })
    ).toThrow();
  });
});
