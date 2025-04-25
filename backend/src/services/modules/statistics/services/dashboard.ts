import Framework from "#src/platform/index";
import Services from "#src/services/index";
import { Context } from "#src/types";
import Invoices from "../../invoices/entities/invoices";

type MonthlyResults = {
  type: Invoices["type"];
  state: Invoices["state"];
  month: string; // YYYY-MM
  amount_ht: string;
  amount: string;
  count: string;
};

export const getDashboard = async (
  ctx: Context,
  clientId: string,
  year?: number
) => {
  const db = await Framework.Db.getService();
  year = year || new Date().getFullYear();

  const client = await Services.Clients.getClient(ctx, clientId);
  const timezone = client?.preferences?.timezone || "Europe/Paris";

  // (base query)
  const query =
    "select" +
    " type, state, " +
    " TO_CHAR(TO_TIMESTAMP(emit_date / 1000) AT TIME ZONE $1, 'YYYY-MM') AS month, " +
    " sum((total->>'total')::numeric) as amount_ht, " +
    " sum((total->>'total_with_taxes')::numeric) as amount, " +
    " count(*) as count " +
    " from invoices " +
    " where state != 'draft' and is_deleted=false and emit_date >= $2 and emit_date <= $3 and client_id = $4 " +
    " group by type, state, month ";

  // We set a 1 day margin to include the last day of the year because of timezones
  const from = new Date(year - 1, 11, 31).getTime();
  const to = new Date(year + 1, 0, 2).getTime();
  let result = (
    await db.custom<{ rows: MonthlyResults[] }>(ctx, query, [
      timezone,
      from,
      to,
      client.id,
    ])
  ).rows;
  result = result.filter((a) => a.month.startsWith(year.toString()));

  const resultAllTime = (
    await db.custom<{ rows: MonthlyResults[] }>(ctx, query, [
      timezone,
      0,
      Date.now(),
      client.id,
    ])
  ).rows;

  const lateInvoices = parseInt(
    (
      await db.custom<{ rows: { count: string }[] }>(
        ctx,
        "select count(*) as count from invoices where type='invoices' and is_deleted=false and state='sent' and (payment_information->>'computed_date')::bigint < $1 and client_id=$2",
        [Date.now(), client.id]
      )
    ).rows[0]?.count
  );

  const count = (
    types: Invoices["type"][],
    states: Invoices["state"][],
    custom: (line: MonthlyResults) => boolean = () => true
  ) => {
    return (
      (resultAllTime || [])
        .filter(
          (a) => types.includes(a.type) && states.includes(a.state) && custom(a)
        )
        .reduce((acc, a) => acc + parseInt(a.count), 0) || 0
    );
  };

  return {
    all: result.map((a) => ({
      ...a,
      amount_ht: parseFloat(a.amount_ht).toFixed(2),
      amount: parseFloat(a.amount).toFixed(2),
      count: parseInt(a.count).toFixed(0),
    })),
    counters: {
      quotes: {
        sent: count(["quotes"], ["sent"]),
        purchase_order: count(["quotes"], ["purchase_order"]),
        completed: count(["quotes"], ["completed", "closed"]),
      },
      invoices: {
        sent: count(["invoices"], ["sent"]),
        late: lateInvoices || 0,
        paid: count(["invoices"], ["completed", "closed"]),
      },
      supplier_quotes: {
        transit: count(["supplier_quotes"], ["sent", "purchase_order"]),
        completed: count(["supplier_quotes"], ["completed", "closed"]),
      },
      supplier_invoices: {
        sent: count(["supplier_invoices"], ["sent"]),
        paid: count(["supplier_invoices"], ["completed", "closed"]),
      },
    },
  };
};
