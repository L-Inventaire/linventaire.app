import Framework from "#src/platform/index";
import Clients from "#src/services/clients/entities/clients";
import { getClient } from "#src/services/clients/services/client";
import { Context } from "#src/types";
import _ from "lodash";
import { DateTime } from "luxon";

export const getStatistics = async (
  ctx: Context,
  clientID: string,
  period: "week" | "month" | "year" = "year",
  dateStart?: Date,
  dateEnd?: Date
) => {
  const client = await getClient(ctx, clientID);

  const dateStartPeriod =
    dateStart || DateTime.now().setZone("utc").startOf(period).toJSDate();

  const dateEndPeriod =
    dateEnd || DateTime.now().setZone("utc").endOf(period).toJSDate();

  const dateStartYear = dateStart
    ? DateTime.fromJSDate(dateStart).setZone("utc").startOf("year").toJSDate()
    : DateTime.now().setZone("utc").startOf("year").toJSDate();

  const dateEndYear = dateEnd
    ? DateTime.fromJSDate(dateEnd).setZone("utc").endOf("year").toJSDate()
    : DateTime.now().setZone("utc").endOf("year").toJSDate();

  const revenueStats = await getTotal(
    ctx,
    client,
    "revenue",
    dateStartPeriod,
    dateEndPeriod,
    period,
    true
  );

  const totalRevenueTable = await getTotal(
    ctx,
    client,
    "revenue",
    dateStartPeriod,
    dateEndPeriod,
    period,
    false,
    true
  );

  const clientBalanceTable = await getClientBalanceTableTotal(ctx, client);

  const revenue = await getTotal(
    ctx,
    client,
    "revenue",
    dateStartPeriod,
    dateEndPeriod,
    period
  );

  const totalRevenue = await getTotal(
    ctx,
    client,
    "revenue",
    dateStartYear,
    dateEndYear,
    period
  );

  const expenses = await getTotal(
    ctx,
    client,
    "expenses",
    dateStartPeriod,
    dateEndPeriod
  );

  const totalExpenses = await getTotal(
    ctx,
    client,
    "expenses",
    dateStartYear,
    dateEndYear
  );

  return {
    revenueStats: revenueStats,
    revenue: revenue,
    totalRevenue: totalRevenue,
    totalRevenueTable: totalRevenueTable,
    clientBalanceTable: clientBalanceTable,
    expenses: expenses,
    totalExpenses: totalExpenses,
    benefits: revenue - expenses,
    totalBenefits: totalRevenue - totalExpenses,
    stockEntries: await getStockEntries(
      ctx,
      client,
      dateStartPeriod,
      dateEndPeriod
    ),
    totalStockEntries: await getStockEntries(
      ctx,
      client,
      dateStartPeriod,
      dateEndPeriod
    ),
    stockExits: await getStockExits(
      ctx,
      client,
      dateStartPeriod,
      dateEndPeriod
    ),
    totalStockExits: await getStockExits(
      ctx,
      client,
      dateStartPeriod,
      dateEndPeriod
    ),
    signedQuotes: await getSignedQuotes(
      ctx,
      client,
      dateStartPeriod,
      dateEndPeriod
    ),
    totalSignedQuotes: await getSignedQuotes(
      ctx,
      client,
      dateStartPeriod,
      dateEndPeriod
    ),
    sentQuotes: await getSentQuotes(
      ctx,
      client,
      dateStartPeriod,
      dateEndPeriod
    ),
    totalSentQuotes: await getSentQuotes(
      ctx,
      client,
      dateStartPeriod,
      dateEndPeriod
    ),
    paidInvoices: await getPaidInvoices(
      ctx,
      client,
      dateStartPeriod,
      dateEndPeriod
    ),
    totalPaidInvoices: await getPaidInvoices(
      ctx,
      client,
      dateStartPeriod,
      dateEndPeriod
    ),
    sentInvoices: await getSentInvoices(
      ctx,
      client,
      dateStartPeriod,
      dateEndPeriod
    ),
    totalSentInvoices: await getSentInvoices(
      ctx,
      client,
      dateStartPeriod,
      dateEndPeriod
    ),
    sentPurchaseOrders: null,
    totalSentPurchaseOrders: null,
    almostLateDeliveries: await getAlmostLateDeliveries(
      ctx,
      client,
      dateStartPeriod,
      dateEndPeriod
    ),
    almostLatePayments: await getAlmostLatePayments(
      ctx,
      client,
      dateStartPeriod,
      dateEndPeriod
    ),
    almostLatePaymentsNoDelay: await getAlmostLatePayments(
      ctx,
      client,
      dateStartPeriod,
      dateEndPeriod,
      7,
      1
    ),
    almostLatePayments30Delay: await getAlmostLatePayments(
      ctx,
      client,
      dateStartPeriod,
      dateEndPeriod,
      0,
      -30
    ),
    almostLatePayments60Delay: await getAlmostLatePayments(
      ctx,
      client,
      dateStartPeriod,
      dateEndPeriod,
      -31,
      -60
    ),
    almostLatePayments90Delay: await getAlmostLatePayments(
      ctx,
      client,
      dateStartPeriod,
      dateEndPeriod,
      -61,
      -90
    ),
    almostLatePayments120Delay: await getAlmostLatePayments(
      ctx,
      client,
      dateStartPeriod,
      dateEndPeriod,
      -91
    ),
  };
};

const getCurrentYearSQLCondition = (column: string) =>
  `EXTRACT(YEAR FROM ${column}) = EXTRACT(YEAR FROM CURRENT_DATE)`;

const getNumberDaysFromNow = (column: string) => getNumberDays("now()", column);

const getNumberDays = (columnA: string, columnB: string) =>
  `(EXTRACT(epoch from age(${columnB}, ${columnA})) / 86400)::int`;

const timestampToDateSQL = (column: string) => `TO_TIMESTAMP(${column} / 1000)`;

const getTimePeriodSQLCondition = (
  startDate: Date,
  endDate: Date,
  column: string
) => {
  return `${column} > ${timestampToDateSQL(
    startDate.getTime().toString()
  )} AND ${column} < ${timestampToDateSQL(endDate.getTime().toString())}`;
};

const getTimeCondition = (startDate: Date, endDate: Date, column: string) => {
  return startDate && endDate
    ? getTimePeriodSQLCondition(startDate, endDate, column)
    : getCurrentYearSQLCondition(column);
};

// Chiffre d'affaires total
export const getTotal = async (
  ctx: Context,
  client: Clients,
  type = "revenue" as "revenue" | "expenses",
  startDate?: Date,
  endDate?: Date,
  period?: "week" | "month" | "year",
  isGroupBy = false,
  isGroupByTags = false
) => {
  const db = await Framework.Db.getService();

  const groupBy =
    period === "year" ? "month" : period === "month" ? "week" : "day";

  const request_invoices = `
    SELECT id from invoices
      WHERE client_id = $1
        AND type = ${type === "revenue" ? "'invoices'" : "'supplier_invoices'"}
        AND state IN ('sent', 'closed')
        AND ${getTimeCondition(
          startDate,
          endDate,
          timestampToDateSQL("emit_date")
        )}
  `;

  const request_credit_notes = `
  SELECT id 
    FROM invoices
    WHERE client_id = $1
      AND type = ${
        type === "revenue" ? "'credit_notes'" : "'supplier_credit_notes'"
      }
      AND state IN ('closed')
      AND ${getTimeCondition(
        startDate,
        endDate,
        timestampToDateSQL("emit_date")
      )}
`;

  const request_amount = `
  SELECT ${
    isGroupBy
      ? `
       DATE_TRUNC('${groupBy}', ${timestampToDateSQL(
          "at.transaction_date"
        )}) AS date,
  `
      : ""
  }
  ${
    isGroupByTags
      ? `
        i.articles->'computed_tags' as tag,
        DATE_TRUNC('year', ${timestampToDateSQL("i.emit_date")}) AS year,
        DATE_TRUNC('month', ${timestampToDateSQL("i.emit_date")}) AS month,
      `
      : ""
  }
  SUM(amount) as sum
  FROM accounting_transactions at
  ${
    isGroupByTags
      ? `
        LEFT JOIN invoices i ON i.id = ANY(at.rel_invoices)
      `
      : ""
  }
  WHERE rel_invoices::text[] && $1
  ${
    isGroupBy
      ? `GROUP BY DATE_TRUNC('${groupBy}', ${timestampToDateSQL(
          "at.transaction_date"
        )}) ORDER BY date;`
      : ""
  }
    ${
      isGroupByTags
        ? `
        GROUP by tag,
        year, 
        month
      `
        : ""
    }
`;

  const invoices = await db.custom<any>(ctx, request_invoices, [client.id]);
  const credit_notes = await db.custom<any>(ctx, request_credit_notes, [
    client.id,
  ]);

  const invoicesAmount = await db.custom<any>(ctx, request_amount, [
    _.flattenDeep((invoices?.rows ?? []).flatMap((i) => i.id)),
  ]);

  const creditNotesAmount = await db.custom<any>(ctx, request_amount, [
    _.flattenDeep((credit_notes?.rows ?? []).flatMap((i) => i.id)),
  ]);

  if (isGroupBy) {
    return (invoicesAmount?.rows ?? []).map((revenue) => {
      const credit = (creditNotesAmount?.rows ?? []).find((credit) =>
        DateTime.fromJSDate(credit.date).equals(
          DateTime.fromJSDate(revenue.date)
        )
      );

      return {
        date: revenue.date,
        revenue: revenue.sum ?? 0,
        credit_note_amount: credit?.sum ?? 0,
        net_amount: revenue.sum - (credit?.sum ?? 0),
      };
    });
  }

  if (isGroupByTags) {
    return (invoicesAmount?.rows ?? []).map((revenue) => {
      const credit = (creditNotesAmount?.rows ?? []).find((credit) => {
        return (
          DateTime.fromJSDate(credit.month).equals(
            DateTime.fromJSDate(revenue.month)
          ) &&
          DateTime.fromJSDate(credit.year).equals(
            DateTime.fromJSDate(revenue.year)
          ) &&
          JSON.stringify(credit.tag) === JSON.stringify(revenue.tag)
        );
      });

      return {
        revenue: revenue.sum ?? 0,
        credit_note_amount: credit?.sum ?? 0,
        net_amount: revenue.sum - (credit?.sum ?? 0),
        tag: revenue.tag,
        year: revenue.year,
        month: revenue.month,
      };
    });
  }

  return (
    (invoicesAmount?.rows[0]?.sum ?? 0) - (creditNotesAmount?.rows[0]?.sum ?? 0)
  );
};

export const getClientBalanceTableTotal = async (ctx, client) => {
  const db = await Framework.Db.getService();

  const num_days = getNumberDays(
    timestampToDateSQL("(payment_information->>'computed_date')::bigint"),
    "now()"
  );

  const request = `
    SELECT
        client,
        SUM((total->>'total')::NUMERIC) as total,
        (${num_days} / 30)::int as which30Days
    FROM invoices
    WHERE client_id = $1
      AND type = 'invoices'
      AND state = 'sent'
      AND ${num_days} > 0
      AND (total->>'total')::NUMERIC > 0
    GROUP BY
        client,
        (${num_days} / 30)::int
    ORDER BY
        client,
        (${num_days} / 30)::int
    ;
  `;

  const grouppedInvoices = (await db.custom<any>(ctx, request, [client.id]))
    ?.rows;

  return grouppedInvoices;
};

export const getStockEntries = async (
  _: Context,
  __: Clients,
  ___?: Date,
  ____?: Date
) => {
  return 0;
};

export const getStockExits = async (
  _: Context,
  __: Clients,
  ___?: Date,
  ____?: Date
) => {
  return 0;
};

export const getSignedQuotes = async (
  ctx: Context,
  client: Clients,
  startDate?: Date,
  endDate?: Date
) => {
  const db = await Framework.Db.getService();

  const signedQuotes = await db.custom<any>(
    ctx,
    `
        SELECT COUNT(*) as signed_quotes
            FROM invoices
            WHERE client_id = $1
            AND type = 'quotes'
            AND state IN ('purchase_order', 'completed', 'closed')
            AND ${getTimeCondition(
              startDate,
              endDate,
              timestampToDateSQL("emit_date")
            )}
    `,
    [client.id]
  );

  return parseInt(signedQuotes?.rows[0]?.signed_quotes ?? "0");
};

export const getSentQuotes = async (
  ctx: Context,
  client: Clients,
  startDate?: Date,
  endDate?: Date
) => {
  const db = await Framework.Db.getService();

  const sentQuotes = await db.custom<any>(
    ctx,
    `
        SELECT COUNT(*) as sent_quotes
            FROM invoices
            WHERE client_id = $1
            AND type = 'quotes'
            AND state IN ('sent')
            AND ${getTimeCondition(
              startDate,
              endDate,
              timestampToDateSQL("emit_date")
            )}
    `,
    [client.id]
  );

  return parseInt(sentQuotes?.rows[0]?.sent_quotes ?? "0");
};

export const getPaidInvoices = async (
  ctx: Context,
  client: Clients,
  startDate?: Date,
  endDate?: Date
) => {
  const db = await Framework.Db.getService();

  const invoices = await db.custom<any>(
    ctx,
    `
        SELECT COUNT(*) as invoices
            FROM invoices
            WHERE client_id = $1
            AND type = 'invoices'
            AND state IN ('closed')
            AND ${getTimeCondition(
              startDate,
              endDate,
              timestampToDateSQL("emit_date")
            )}
    `,
    [client.id]
  );

  return parseInt(invoices?.rows[0]?.invoices ?? "0");
};

export const getSentInvoices = async (
  ctx: Context,
  client: Clients,
  startDate?: Date,
  endDate?: Date
) => {
  const db = await Framework.Db.getService();

  const invoices = await db.custom<any>(
    ctx,
    `
        SELECT COUNT(*) as invoices
            FROM invoices
            WHERE client_id = $1
            AND type = 'invoices'
            AND state IN ('sent')
            AND ${getTimeCondition(
              startDate,
              endDate,
              timestampToDateSQL("emit_date")
            )}
    `,
    [client.id]
  );

  return parseInt(invoices?.rows[0]?.invoices ?? "0");
};

export const getSentPurchaseOrders = async (
  ctx: Context,
  client: Clients,
  startDate?: Date,
  endDate?: Date
) => {
  const db = await Framework.Db.getService();

  const quotes = await db.custom<any>(
    ctx,
    `
        SELECT COUNT(*) as quotes
            FROM invoices
            WHERE client_id = $1
            AND type = 'supplier_quotes'
            AND state = 'sent'
            AND ${getTimeCondition(
              startDate,
              endDate,
              timestampToDateSQL("emit_date")
            )}
    `,
    [client.id]
  );

  return parseInt(quotes?.rows[0]?.quotes ?? "0");
};

// Livraisons qui approchent de la date limite
export const getAlmostLateDeliveries = async (
  ctx: Context,
  client: Clients,
  startDate?: Date,
  endDate?: Date
) => {
  const db = await Framework.Db.getService();

  const lateInvoices = await db.custom<any>(
    ctx,
    `
        SELECT id as invoices
            FROM invoices
            WHERE client_id = $1
              AND type = 'quotes'
              AND state = 'purchase_order'
              AND (
                ${getNumberDaysFromNow(
                  timestampToDateSQL("emit_date")
                )} > (COALESCE(delivery_delay, 30) - 7)
                OR
                ${getNumberDaysFromNow(timestampToDateSQL("delivery_date"))} < 7
              )
              AND ${getTimeCondition(
                startDate,
                endDate,
                timestampToDateSQL("emit_date")
              )}
    `,
    [client.id]
  );

  return (lateInvoices?.rows ?? []).map((i) => i.invoices);
};

// Paiements qui approchent de la date limite
export const getAlmostLatePayments = async (
  ctx: Context,
  client: Clients,
  startDate?: Date,
  endDate?: Date,
  maxDelay?: number,
  minDelay?: number,
  contact?: string,
  selectFull = false
) => {
  const db = await Framework.Db.getService();

  const num_days = getNumberDays(
    timestampToDateSQL("(payment_information->>'computed_date')::bigint"),
    "now()"
  );

  const request = `
        SELECT 
            ${
              selectFull
                ? `*, ${num_days} as days`
                : `id as invoices, ${num_days} as days`
            }
            FROM invoices
            WHERE 
              client_id = $1
              AND type = 'invoices'
              AND state = 'sent'
              ${
                !_.isUndefined(maxDelay)
                  ? `AND ${num_days} < ${maxDelay ?? 7}`
                  : ""
              }
              ${!_.isUndefined(minDelay) ? `AND ${num_days} > ${minDelay}` : ""}
              ${contact ? `AND client = '${contact}'` : ""}
    `;

  const lateInvoices = await db.custom<any>(ctx, request, [client.id]);

  return lateInvoices?.rows ?? [];
};
