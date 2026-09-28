import { describe, expect, test } from "@jest/globals";
import { mergeActivity, TableActivityRow } from "./tenants";

const row = (
  client_id: string,
  values: Partial<TableActivityRow>
): TableActivityRow => ({
  client_id,
  total: 0,
  created_30d: 0,
  updated_7d: 0,
  updated_30d: 0,
  last_activity_at: null,
  ...values,
});

describe("mergeActivity", () => {
  test("sums the activity of every table per company", () => {
    const { activity, documents } = mergeActivity({
      invoices: [
        row("a", {
          total: 10,
          created_30d: 2,
          updated_7d: 1,
          updated_30d: 3,
          last_activity_at: 1000,
        }),
        row("b", { total: 1, last_activity_at: 50 }),
      ],
      contacts: [
        row("a", {
          total: 5,
          created_30d: 1,
          updated_7d: 1,
          updated_30d: 1,
          last_activity_at: 2000,
        }),
      ],
    });

    expect(activity.a).toEqual({
      total: 15,
      created_30d: 3,
      updated_7d: 2,
      updated_30d: 4,
      last_activity_at: 2000,
    });
    expect(activity.b.last_activity_at).toBe(50);
    expect(documents).toEqual({
      a: { invoices: 10, contacts: 5 },
      b: { invoices: 1 },
    });
  });

  test("keeps the last activity empty when no document has a date", () => {
    const { activity } = mergeActivity({
      invoices: [row("a", { total: 1 })],
    });
    expect(activity.a.last_activity_at).toBeNull();
  });
});
