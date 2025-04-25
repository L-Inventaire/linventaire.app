import { describe, expect, test } from "@jest/globals";
import { displayDate } from "./utils";

describe("generatePdfComponentsUtils", () => {
  test("should return the correct value", () => {
    expect(displayDate(new Date("2025-01-01T00:00:00Z"), "Europe/Paris")).toBe(
      "2025-01-01"
    );
    expect(
      displayDate(new Date("2025-01-01T00:00:00Z"), "America/New_York")
    ).toBe("2024-12-31");
    // Expect a date defined in new york to be displayed correctly in new york
    expect(
      displayDate(new Date("2025-01-01T00:00:00-05:00"), "America/New_York")
    ).toBe("2025-01-01");
    expect(displayDate("2025-01-01", "America/New_York")).toBe("2025-01-01");
    expect(displayDate("2025-01-01", "Europe/Paris")).toBe("2025-01-01");
  });
});
