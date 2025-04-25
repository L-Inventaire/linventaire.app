import Framework from "#src/platform/index";
import Services from "#src/services/index";
import { Context } from "#src/types";
import _ from "lodash";
import { ArticlesDefinition } from "../../articles/entities/articles";
import Invoices, { InvoicesDefinition } from "../../invoices/entities/invoices";
import { applyOffset } from "../../invoices/triggers/recurring-generate-invoice";
import { getTimezoneOffset } from "../../invoices/utils";

/**
 * This function will generate invoices custom statistics for 2d tables
 */
export const getMatrix = async (
  ctx: Context,
  clientId: string,
  month: string // 2025-01
) => {
  const db = await Framework.Db.getService();
  const client = await Services.Clients.getClient(ctx, clientId);
  const timezone = client?.preferences?.timezone || "Europe/Paris";

  const { offsetms } = getTimezoneOffset(timezone);

  const from = new Date(month + "-01").getTime() - offsetms;
  const to = new Date(from);
  applyOffset(to, "monthly", timezone);
  const invoices = await db.select<Invoices>(
    { ...ctx, role: "SYSTEM" },
    InvoicesDefinition.name,
    {
      where:
        "client_id=$1 and is_deleted=false and type='invoices' and state!='draft' and emit_date >= $2 and emit_date < $3",
      values: [clientId, from, to.getTime()],
    },
    { limit: 5000 }
  );

  const lines: { total: Invoices["total"]; article: string; amount: number }[] =
    invoices.reduce((acc, invoice) => {
      const lines = (invoice.content || [])
        .filter(
          (a) =>
            a.article &&
            ["product", "service", "consumable"].includes(a.type) &&
            (!a.optional || a.optional_checked)
        )
        .map((a) => {
          const amountWithDiscounts =
            ((a.unit_price || 0) * (a.quantity || 0) * invoice.total.total) /
            invoice.total.initial;
          return {
            article: a.article,
            amount: (a.unit_price || 0) * (a.quantity || 0),
            amount_with_discounts: amountWithDiscounts, // Will we use this value ? I don't know
            total: invoice.total,
          };
        });
      return [...acc, ...lines];
    }, []);

  const articlesIds = _.uniq(lines.map((a) => a.article));
  const articles = (
    await db.custom<{
      rows: {
        id: string;
        tags: string[];
      }[];
    }>(
      ctx,
      `select id, tags from ${ArticlesDefinition.name} where client_id=$1 and id = ANY($2)`,
      [clientId, articlesIds]
    )
  ).rows;
  const tagsMap = _.fromPairs(articles.map((a) => [a.id, a.tags]));

  // Get amount per tag
  const result: { [tag: string]: number } = {};
  for (const line of lines) {
    const tags = tagsMap[line.article];
    let tag = "multiple";
    if (!tags) tag = "untagged";
    else if (tags.length === 1) tag = tags[0];

    if (!result[tag]) result[tag] = 0;
    result[tag] += line.amount;
  }

  return result;
};
