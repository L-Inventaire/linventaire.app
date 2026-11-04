import { describe, expect, test } from "@jest/globals";
import { displayDate, getCountryName, hasIdentityNumber } from "./utils";

describe("generatePdfComponentsUtils", () => {
  test("country codes are displayed by name", () => {
    expect(getCountryName("FR", "fr")).toBe("France");
    expect(getCountryName("be", "fr")).toBe("Belgique");
    expect(getCountryName("France", "fr")).toBe("France");
    expect(getCountryName("", "fr")).toBe("");
  });

  test("should return the correct value", () => {
    expect(
      displayDate(new Date("2025-01-01T00:00:00Z"), "Europe/Paris", "en")
    ).toBe("2025-01-01");
    expect(
      displayDate(new Date("2025-01-01T00:00:00Z"), "America/New_York", "en")
    ).toBe("2024-12-31");
    // Expect a date defined in new york to be displayed correctly in new york
    expect(
      displayDate(
        new Date("2025-01-01T00:00:00-05:00"),
        "America/New_York",
        "en"
      )
    ).toBe("2025-01-01");
    expect(displayDate("2025-01-01", "America/New_York", "en")).toBe(
      "2025-01-01"
    );
    expect(displayDate("2025-01-01", "Europe/Paris", "en")).toBe("2025-01-01");
  });

  test("placeholder registration and VAT numbers are not displayed", () => {
    expect(hasIdentityNumber("00000000000000")).toBe(false);
    expect(hasIdentityNumber("FR00000000000")).toBe(false);
    expect(hasIdentityNumber("")).toBe(false);
    expect(hasIdentityNumber(undefined)).toBe(false);
    expect(hasIdentityNumber("590800215")).toBe(true);
    expect(hasIdentityNumber("FR70590800215")).toBe(true);
  });
});
