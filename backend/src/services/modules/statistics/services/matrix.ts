import Framework from "#src/platform/index";
import Services from "#src/services/index";
import { Context } from "#src/types";
import _ from "lodash";
import { ArticlesDefinition } from "../../articles/entities/articles";
import Invoices, { InvoicesDefinition } from "../../invoices/entities/invoices";
import { DateTime } from "luxon";

/**
 * Returns [from, to[ timestamps (ms) of a month ("2025-01") in a timezone
 */
export const getMonthBounds = (month: string, timezone: string) => {
  const start = DateTime.fromISO(month + "-01", { zone: timezone }).startOf(
    "month"
  );
  return {
    from: start.toMillis(),
    to: start.plus({ months: 1 }).toMillis(),
  };
};

/**
 * Split the invoice total (HT, after discounts) on its lines.
 * Every counted line is kept, with or without article (down payments, down
 * payment deductions, corrections...), so the sum of the lines is always the
 * invoice total. Line discounts are applied on each line and the global
 * discount is applied proportionally.
 */
export const getInvoiceLinesAmounts = (
  invoice: Pick<Invoices, "content" | "total">
): { article: string | null; amount: number }[] => {
  const lines = (invoice.content || [])
    .filter((a) => !a.optional || a.optional_checked)
    .map((a) => {
      const price =
        (parseFloat(a.unit_price as any) || 0) *
        (parseFloat(a.quantity as any) || 0);
      let discount = 0;
      if (a.discount?.mode === "percentage") {
        discount = price * ((parseFloat(a.discount.value as any) || 0) / 100);
      } else if (a.discount?.mode === "amount") {
        discount = parseFloat(a.discount.value as any) || 0;
      }
      return { article: a.article || null, amount: price - discount };
    });

  // Apply the global discount proportionally so lines sum up to the total
  const linesTotal = lines.reduce((acc, a) => acc + a.amount, 0);
  const total = invoice.total?.total ?? linesTotal;
  const ratio = linesTotal ? total / linesTotal : 1;
  return lines.map((a) => ({ ...a, amount: a.amount * ratio }));
};

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

  // Month bounds in the client timezone. Both bounds are computed separately so
  // a DST change during the month doesn't shift the end bound (e.g. March in
  // Europe/Paris would otherwise end on April 1st at 01:00 and include the
  // invoices of April 1st).
  const { from, to } = getMonthBounds(month, timezone);
  const invoices = await db.select<Invoices>(
    { ...ctx, role: "SYSTEM" },
    InvoicesDefinition.name,
    {
      where:
        "client_id=$1 and is_deleted=false and type='invoices' and state!='draft' and emit_date >= $2 and emit_date < $3",
      values: [clientId, from, to],
    },
    { limit: 5000 }
  );

  const lines = invoices.flatMap(getInvoiceLinesAmounts);

  const articlesIds = _.uniq(lines.map((a) => a.article).filter(Boolean));
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

  // Get amount per tag, summed in cents to avoid floating point drift
  const cents: { [tag: string]: number } = {};
  for (const line of lines) {
    const tags = line.article ? tagsMap[line.article] : null;
    let tag = "multiple";
    if (!tags?.length) tag = "untagged";
    else if (tags.length === 1) tag = tags[0];

    if (!cents[tag]) cents[tag] = 0;
    cents[tag] += Math.round(line.amount * 100);
  }

  return _.mapValues(cents, (value) => value / 100);
};
