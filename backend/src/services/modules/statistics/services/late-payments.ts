import Framework from "#src/platform/index";
import { Context } from "#src/types";
import _ from "lodash";
import Contacts, { ContactsDefinition } from "../../contacts/entities/contacts";

type LateCellType = {
  total_invoices: number;
  total_credit_notes: number;
  total: number;

  count_invoices: number;
  count_credit_notes: number;
  count: number;
};

type SumType = LateCellType & {
  contact: string;
};

type SumQueryType = {
  amount: number;
  count: number;
  contact: string;
};

type LateType = {
  id: string;
  contact?: Contacts;
  total: LateCellType;
  future: LateCellType;
  d30: LateCellType;
  d60: LateCellType;
  d90: LateCellType;
  d120: LateCellType;
  d120plus: LateCellType;
};

/**
 * This function generates a table to per client/supplier account status for 0-30, 31-60, 61-90, 91-120, and 120+ days late payments.
 */
// TODO this is a bit complex, we should simplify it
export const getLatePayments = async (
  ctx: Context,
  clientId: string,
  type: "client" | "supplier" = "client"
) => {
  const db = await Framework.Db.getService();

  const separatedValues: { [key: string]: SumType[] } = {};
  const invoicesTypes =
    type === "client"
      ? ["invoices", "credit_notes"]
      : ["supplier_invoices", "supplier_credit_notes"];
  for (const invoicesType of invoicesTypes) {
    const isCreditNotes =
      invoicesType === "credit_notes" ||
      invoicesType === "supplier_credit_notes";

    const separatedValuesTemp: { [key: string]: SumQueryType[] } = {};

    const contactRow = type === "client" ? "client" : "supplier";
    const common1 =
      "select count(*) as count, sum((total->>'total')::numeric) as amount, " +
      contactRow +
      " as contact from invoices where";
    const common2 =
      "client_id=$1 and is_deleted=false and state='sent' and type=$2 group by " +
      contactRow +
      " order by amount desc";
    const computedDate =
      "TO_TIMESTAMP((payment_information->>'computed_date')::numeric / 1000)";
    separatedValuesTemp["total"] = (
      await db.custom<{ rows: SumQueryType[] }>(ctx, `${common1} ${common2}`, [
        clientId,
        invoicesType,
      ])
    ).rows;
    separatedValuesTemp["future"] = (
      await db.custom<{ rows: SumQueryType[] }>(
        ctx,
        `${common1} ${computedDate} > NOW() and ${common2}`,
        [clientId, invoicesType]
      )
    ).rows;
    separatedValuesTemp["d30"] = (
      await db.custom<{ rows: SumQueryType[] }>(
        ctx,
        `${common1} ${computedDate} <= NOW() and ${computedDate} > NOW() - INTERVAL '30 days' and ${common2}`,
        [clientId, invoicesType]
      )
    ).rows;
    separatedValuesTemp["d60"] = (
      await db.custom<{ rows: SumQueryType[] }>(
        ctx,
        `${common1} ${computedDate} <= NOW() - INTERVAL '30 days' and ${computedDate} > NOW() - INTERVAL '60 days' and ${common2}`,
        [clientId, invoicesType]
      )
    ).rows;
    separatedValuesTemp["d90"] = (
      await db.custom<{ rows: SumQueryType[] }>(
        ctx,
        `${common1} ${computedDate} <= NOW() - INTERVAL '60 days' and ${computedDate} > NOW() - INTERVAL '90 days' and ${common2}`,
        [clientId, invoicesType]
      )
    ).rows;
    separatedValuesTemp["d120"] = (
      await db.custom<{ rows: SumQueryType[] }>(
        ctx,
        `${common1} ${computedDate} <= NOW() - INTERVAL '90 days' and ${computedDate} > NOW() - INTERVAL '120 days' and ${common2}`,
        [clientId, invoicesType]
      )
    ).rows;
    separatedValuesTemp["d120plus"] = (
      await db.custom<{ rows: SumQueryType[] }>(
        ctx,
        `${common1} ${computedDate} <= NOW() - INTERVAL '120 days' and ${common2}`,
        [clientId, invoicesType]
      )
    ).rows;

    // Compile all results
    for (const key in separatedValuesTemp) {
      if (!separatedValues[key]) {
        separatedValues[key] = [];
      }
      for (const line of separatedValuesTemp[key]) {
        let existing = separatedValues[key].find(
          (a) => a.contact === line.contact
        );
        if (!existing) {
          separatedValues[key].push({
            total_invoices: 0,
            total_credit_notes: 0,
            total: 0,
            count_invoices: 0,
            count_credit_notes: 0,
            count: 0,
            contact: line.contact,
          });
        }
        existing = separatedValues[key].find((a) => a.contact === line.contact);
        if (isCreditNotes) {
          existing.total_credit_notes = line.amount;
          existing.count_credit_notes = line.count;
        } else {
          existing.total_invoices = line.amount;
          existing.count_invoices = line.count;
        }
      }
    }
  }

  // Calculate totals and counts
  for (const key in separatedValues) {
    for (const line of separatedValues[key]) {
      line.total = line.total_invoices - line.total_credit_notes;
      line.count = line.count_invoices + line.count_credit_notes;
    }
  }

  // Aggregate all results
  const result: LateType[] = [];
  for (const key in separatedValues) {
    for (const line of separatedValues[key]) {
      const existing = result.find((a) => a.id === line.contact);
      if (existing) {
        existing[key] = _.omit(line, "contact");
      } else {
        const defaultCell = {
          total_invoices: 0,
          total_credit_notes: 0,
          total: 0,
          count_invoices: 0,
          count_credit_notes: 0,
          count: 0,
        };
        result.push({
          id: line.contact,
          total: _.cloneDeep(defaultCell),
          future: _.cloneDeep(defaultCell),
          d30: _.cloneDeep(defaultCell),
          d60: _.cloneDeep(defaultCell),
          d90: _.cloneDeep(defaultCell),
          d120: _.cloneDeep(defaultCell),
          d120plus: _.cloneDeep(defaultCell),
          [key]: _.omit(line, "contact"),
        });
      }
    }
  }

  // Get all contact details
  const ids = result.map((a) => a.id);
  const contacts = await db.select<Contacts>(
    { ...ctx, role: "SYSTEM" },
    ContactsDefinition.name,
    {
      where: "id = ANY($1) and client_id=$2",
      values: [ids, clientId],
    },
    { limit: ids.length }
  );

  for (const line of result) {
    line.contact = (contacts || []).find((a) => a.id === line.id);
  }

  return result;
};
