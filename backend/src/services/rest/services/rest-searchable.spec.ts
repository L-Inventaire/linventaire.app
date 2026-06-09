import { describe, test, expect } from "@jest/globals";
import { expandSearchable, expandNumericPrefixes } from "./rest";

describe("rest-searchable", () => {
  test("rest-searchable", () => {
    expect(expandSearchable("Name P0116 P0116 Ingram Cloud S001233")).toContain(
      "1233"
    );
    expect(expandSearchable("Name P0116 P0116 Ingram Cloud S001233")).toContain(
      "S1233"
    );
    expect(expandSearchable("Name P0116 P0116 Ingram Cloud S001233")).toContain(
      "P116"
    );
    expect(expandSearchable("Name P0116 P0116 Ingram Cloud S001233")).toContain(
      "Ingram"
    );
    expect(expandSearchable("12G")).toContain("12 G");
  });

  test("expandNumericPrefixes", () => {
    // Generates prefixes for numeric segments of length >= 3
    expect(expandNumericPrefixes("TSU-001001-R")).toContain("001");
    expect(expandNumericPrefixes("TSU-001001-R")).toContain("0010");
    expect(expandNumericPrefixes("TSU-001001-R")).toContain("00100");
    // Full segment already present via expandSearchable, not duplicated here
    expect(expandNumericPrefixes("TSU-001001-R")).not.toContain("001001 001001");
    // Short segments (< 3) produce no extra tokens
    expect(expandNumericPrefixes("AB-12-C")).toBe("AB-12-C");
    // No numeric segment at all
    expect(expandNumericPrefixes("REFABC")).toBe("REFABC");
  });
});
