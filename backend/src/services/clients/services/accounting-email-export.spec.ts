import { describe, expect, jest, test } from "@jest/globals";

jest.mock("#src/services/index", () => ({ __esModule: true, default: {} }));

import { getAccountingEmailExport } from "./client";

const NOW = 1_800_000_000_000;

describe("getAccountingEmailExport", () => {
  test("setting an address activates it now", () => {
    expect(
      getAccountingEmailExport(null, { sales_email: " ventes@compta.fr " }, NOW)
    ).toEqual({
      sales_email: "ventes@compta.fr",
      sales_enabled_at: NOW,
      purchases_email: "",
      purchases_enabled_at: 0,
    });
  });

  test("changing the address keeps the activation date", () => {
    expect(
      getAccountingEmailExport(
        {
          sales_email: "old@compta.fr",
          sales_enabled_at: 1000,
          purchases_email: "achats@compta.fr",
          purchases_enabled_at: 2000,
        },
        { sales_email: "new@compta.fr", sales_enabled_at: 5 },
        NOW
      )
    ).toEqual({
      sales_email: "new@compta.fr",
      sales_enabled_at: 1000,
      purchases_email: "achats@compta.fr",
      purchases_enabled_at: 2000,
    });
  });

  test("removing the address disables it, setting it again reactivates", () => {
    const disabled = getAccountingEmailExport(
      { purchases_email: "achats@compta.fr", purchases_enabled_at: 1000 },
      { purchases_email: "" },
      NOW
    );
    expect(disabled.purchases_enabled_at).toBe(0);
    expect(
      getAccountingEmailExport(
        disabled,
        { purchases_email: "achats@compta.fr" },
        NOW
      ).purchases_enabled_at
    ).toBe(NOW);
  });

  test("an invalid address is refused", () => {
    expect(() =>
      getAccountingEmailExport(null, { sales_email: "a@b.fr, c@d.fr" }, NOW)
    ).toThrow();
  });
});
