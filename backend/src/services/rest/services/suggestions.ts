import _ from "lodash";
import Platform from "../../../platform";
import Services from "../../../services";
import { Context } from "../../../types";
import { UsersDefinition } from "../../users/entities/users";
import { isTableAvailable } from "./utils";
import { schema as getSchema } from "./rest";

/** Returns 10 most popular values for a column */
export const suggestions = async (
  ctx: Context,
  table: string,
  column: string,
  query?: string
) => {
  if (!(await isTableAvailable(ctx, table, "READ")))
    throw new Error("Invalid object type");
  const driver = await Platform.Db.getService();
  const schema = await getSchema(ctx, table);

  if (_.get(schema, column) === undefined) {
    return [];
  }

  const isArray = _.isArray(_.get(schema, column));
  const type = isArray ? _.get(schema, column)[0] : _.get(schema, column);

  if (type === "boolean") {
    return [{ value: true }, { value: false }];
  }

  const columnName = column
    .split(".")
    .map((a, i) => (i === 0 ? a : `'${a}'`))
    .join("->>");

  const useQuery = query && type.indexOf("type:") !== 0;
  const isJsonb = column.split(".").length > 1;
  const sqlQuery = isArray
    ? isJsonb
      ? `SELECT unnested AS value, COUNT(unnested) AS count, MAX(updated_at) AS updated
        FROM (
            SELECT value AS unnested, a.updated_at FROM ${table} a,
            LATERAL jsonb_array_elements_text(
              a.${columnName.replace(/->>/gm, "->")}
            ) AS value
            WHERE a.client_id = $1 ${useQuery ? ` AND b ILIKE $2` : ""}
        ) sub GROUP BY unnested ORDER BY count DESC, updated DESC LIMIT 10`
      : `SELECT unnested AS value, COUNT(unnested) AS count, MAX(updated_at) AS updated
        FROM (
          SELECT unnest(${columnName}) AS unnested, updated_at
          FROM ${table} a, unnest(${columnName}) b
          WHERE client_id=$1 ${useQuery ? ` AND b ILIKE $2` : ""}
        ) sub GROUP BY unnested ORDER BY count DESC, updated DESC LIMIT 10`
    : `SELECT ${columnName} AS value, COUNT(${columnName}) AS count, MAX(updated_at) AS updated
      FROM ${table}
      WHERE client_id=$1 ${useQuery ? ` AND ${columnName} ILIKE $2` : ""}
      GROUP BY ${columnName} ORDER BY count DESC, updated DESC LIMIT 10`;
  const values = [ctx.client_id, ...(useQuery ? [query + "%"] : [])];

  const suggestions = await driver.select<{
    value: string;
    count: number;
    updated: string;
  }>({ ...ctx, role: "SYSTEM" }, table, {
    sql: sqlQuery,
    values: values,
  });

  let result: {
    count: number;
    updated: number;
    value: string;
    label: string;
    item: any;
  }[] = suggestions.map((a) => ({
    count: a.count,
    updated: parseInt(a.updated) || 0,
    value: a.value,
    label: a.value,
    item: null,
  }));

  // Column relate to another table
  const relTable = table;
  if (type.indexOf("type:") === 0) {
    const table = type.split(":")[1];
    const ids = suggestions.map((a) => a.value?.split(":").pop()); // Ids can be of format table:id like files:d11q0azgtuw0

    const def = Platform.TriggersManager.getEntities()[table];

    if (def && def.columns["client_id"]) {
      const labelColumn: ((o: any) => string) | string =
        def?.rest?.label || "id";

      let counter = 3;
      const queryCond = [];
      const queryValues = [];
      if (query.trim() && def.columns.searchable_generated) {
        const words = query.split(" ");
        for (const word of words) {
          if (!word.trim()) continue;
          queryCond.push(
            `searchable_generated @@ to_tsquery('simple', unaccent($${counter}))`
          );
          const isLast = words.indexOf(word) === words.length - 1;
          queryValues.push(word + (isLast ? ":*" : ""));
          counter++;
        }
      }

      // If entity has concept of rel_table, then we can use it to better filter suggestions
      const hasRelTable = def?.columns["rel_table"];

      const relatedSuggestions = await driver.select<{ id: string }>(
        {
          ...ctx,
          role: "SYSTEM",
        },
        table,
        {
          where: `client_id = $1 ${
            hasRelTable ? "AND rel_table=$2" : "AND $2 = $2"
          } ${query ? ` AND ${queryCond.join(" AND ")}` : " AND id = ANY($3)"}`,
          values: [
            ctx.client_id,
            relTable,
            ...(queryValues.length > 0 ? queryValues : [ids]),
          ],
        }
      );
      result = relatedSuggestions.map((a) => {
        const suggestionsObj = result.find((s) => s.value === a.id);
        return {
          count: suggestionsObj?.count || 0,
          updated: suggestionsObj?.updated || 0,
          value: a.id,
          label:
            typeof labelColumn === "function"
              ? labelColumn(a)
              : a[labelColumn] || a.id,
          item: _.omit(a as any, [
            "searchable",
            "searchable_generated",
            ...(def?.rest?.hidden || []),
          ]),
        };
      });
    } else if (table === UsersDefinition.name) {
      // There is one special case with users which don't have client_id, we must implement it as a special case
      const users = await Services.Clients.getClientUsers(ctx, ctx.client_id);
      result = users
        .filter((a) => (a.user as any).id && a.active)
        .map((a) => {
          const suggestionsObj = result.find((s) => s.value === a.user_id);
          return {
            count: suggestionsObj?.count || 0,
            updated: suggestionsObj?.updated || 0,
            value: (a.user as any).id,
            label: (a.user as any).full_name || "",
            item: a.user,
          };
        })
        .filter((a) =>
          query
            .split(" ")
            .every(
              (q) =>
                a.label.toLocaleLowerCase().indexOf(q.toLocaleLowerCase()) === 0
            )
        );
    }
  }

  return _.sortBy(
    result,
    (a) => -a.count,
    (a) => -a.updated
  ).filter((a) => a.value);
};
