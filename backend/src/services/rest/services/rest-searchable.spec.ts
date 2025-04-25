import { describe, test, expect } from "@jest/globals";
import { expandSearchable } from "./rest";

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
});
