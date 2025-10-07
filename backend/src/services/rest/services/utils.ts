import _ from "lodash";
import Services from "../..";
import { default as Framework } from "../../../platform";
import { Context, getCtxCache, setCtxCache } from "../../../types";
import { RestSearchQuery, RestSearchQueryOp } from "../type";

export const isTableAvailable = async (
  ctx: Context,
  table: string,
  action: "MANAGE" | "READ" | "WRITE",
  entity?: any
) => {
  if (ctx.role === "SYSTEM") return true;

  // Small cache to avoid multiple checks, only for reads
  const cacheKey = table + ":" + action;
  const cachedValue = getCtxCache(ctx, cacheKey);
  if (cachedValue && !entity) return cachedValue;

  const entities = Framework.TriggersManager.getEntities();
  const entitiesRoles = Framework.TriggersManager.getEntitiesRoles();
  if (entities[table] !== undefined) {
    let tmp: boolean;
    if (typeof entitiesRoles[table] === "function") {
      tmp = await entitiesRoles[table](ctx, entity, action);
    } else {
      tmp = await Services.Clients.checkUserRoles(ctx, ctx.client_id, [
        entitiesRoles[table][action] || "CLIENT_MANAGE",
      ]);
    }
    setCtxCache(ctx, cacheKey, tmp);
    if (!tmp) {
      throw new Error("Unauthorized access to table " + table);
    }
    return tmp;
  }

  console.info("[isTableAvailable] Table not found", table);
  setCtxCache(ctx, cacheKey, false);
  return false;
};

export const generateWhereClause = (
  ctx: Context,
  queries: RestSearchQuery[],
  columnDefinitions: Record<string, string>,
  schema: any
) => {
  const where: string[] = [];
  const values: any[] = [];
  let counter = 1;

  queries.forEach((query) => {
    if (query.key === "query") return; // Done later on

    const columnType =
      columnDefinitions[(query.key?.split(".")?.[0] || "").replace("[0]", "")];
    let columnName = query.key
      .split(".")
      .map((a, i) => (i === 0 ? a : `'${a}'`))
      .join("->>")
      .replace("[0]", "[1]");

    if (!columnType) return;

    let isJsonbArray = false;
    if (columnType.toLocaleLowerCase() === "jsonb") {
      isJsonbArray = _.isArray(_.get(schema, query.key));
    }

    const isArray = columnType.match(/\[(.*)\]$/) !== null;
    const clauseParts: string[] = [];

    const schemaColumnType = _.isArray(_.get(schema, query.key))
      ? _.get(schema, query.key)[0]
      : _.get(schema, query.key);
    if (schemaColumnType.match(/^type:/)) {
      query.values = [
        ...query.values,
        ...query.values
          .filter((a) => a.op === "equals" || a.op === "regex")
          .map((a) => ({
            op: a.op,
            value: schemaColumnType.split(":").pop() + ":" + a.value,
          })),
      ];
    }

    // Edge case: We must cast the JSONB value to a number
    if (schemaColumnType === "number" && columnType === "JSONB") {
      columnName = `(${columnName})::numeric`;
    }

    if (query.empty) {
      // If it's an array
      if (isArray) {
        clauseParts.push(`${columnName} IS NULL OR ${columnName} = '{}'`);
      } else if (columnType === "JSONB") {
        clauseParts.push(
          `${columnName} IS NULL OR ${columnName} = 'null' OR ${columnName} = '[null]' OR ${columnName} = '[]' OR ${columnName} = '{}'`
        );
      } else {
        clauseParts.push(`${columnName} IS NULL OR ${columnName} = ''`);
      }
    } else {
      (query.values || []).forEach((value) => {
        if (
          value.value === null ||
          value.value === undefined ||
          value.value === ""
        ) {
          return;
        }

        if (
          _.isArray(value.value) &&
          value.value[0] === null &&
          value.value[1] !== null
        ) {
          value.op = "lte";
          value.value = value.value[1];
        } else if (
          _.isArray(value.value) &&
          value.value[1] === null &&
          value.value[0] !== null
        ) {
          value.op = "gte";
          value.value = value.value[0];
        } else if (
          _.isArray(value.value) &&
          value.value[0] === null &&
          value.value[1] === null
        ) {
          return;
        }

        let clause = "";
        switch (value.op) {
          case "equals":
            if (typeof value.value === "string") {
              clause = isJsonbArray
                ? `EXISTS ( SELECT 1 FROM jsonb_array_elements_text(${columnName.replace(
                    /->>/gm,
                    "->"
                  )}) AS elements(value) WHERE lower(unaccent(value)) = lower(unaccent($${counter})) )`
                : isArray
                ? `lower(unaccent($${counter})) = ANY(${query.key}::text[])`
                : `lower(unaccent(${columnName})) = lower(unaccent($${counter}))`;
            } else {
              clause = isArray
                ? `$${counter} = ANY(${query.key})`
                : `${columnName} = $${counter}`;
            }
            break;
          case "regex":
            clause = `((${columnName})::text % $${counter} OR (${columnName})::text ~ $${
              counter + 1
            })`;

            // We'll copy the value as it is used twice here
            values.push(value.value);
            counter++;

            break;
          case "gte":
          case "lte":
            // For JSONB arrays it will be the number of items in the array
            if (isJsonbArray) {
              clause = `jsonb_array_length(coalesce((${columnName.replace(
                /->>/gm,
                "->"
              )})::jsonb, '[]'::jsonb)) ${
                value.op === "gte" ? ">=" : "<="
              } $${counter}`;
            } else if (isArray) {
              // Compare array length
              clause = `array_length(coalesce(${columnName}, '{}'), 1) ${
                value.op === "gte" ? ">=" : "<="
              } $${counter}`;
            } else {
              clause = `${columnName} ${
                value.op === "gte" ? ">=" : "<="
              } $${counter}`;
            }
            break;
          case "range":
            if (isJsonbArray) {
              clause = `(jsonb_array_length(coalesce((${columnName.replace(
                /->>/gm,
                "->"
              )})::jsonb, '[]'::jsonb)) >= $${counter}
        AND jsonb_array_length(coalesce((${columnName.replace(
          /->>/gm,
          "->"
        )})::jsonb, '[]'::jsonb)) <= $${counter + 1})`;
            } else if (isArray) {
              clause = `(array_length(coalesce(${columnName}, '{}'), 1) >= $${counter}
        AND array_length(coalesce(${columnName}, '{}'), 1) <= $${counter + 1})`;
            } else {
              clause = `(${columnName} >= $${counter} AND ${columnName} <= $${
                counter + 1
              })`;
            }
            break;
        }

        if (clause) {
          clauseParts.push(clause);
          const items = _.isArray(value.value) ? value.value : [value.value];
          for (let val of items) {
            // If val is date and column is number we convert it to timestamp
            if (
              columnType.match(/BIGINT|INTEGER|BIGINT/) &&
              typeof val === "string" &&
              val.match(/^\d{4}-\d{2}-\d{2}/)
            ) {
              val = new Date(val).getTime();
            }

            // If val is number and column is date we convert it to date
            if (
              columnType.match(/DATE/) &&
              (typeof val === "number" ||
                (typeof val === "string" && val.match(/^\d+$/)))
            ) {
              val = new Date(parseInt(val as any)).toISOString();
            }

            // Range adds its value inside the switch
            values.push(val);
            counter++;
          }
        }
      });
    }

    if (clauseParts.length === 0) return;

    let combinedClause = clauseParts.join(" OR ");
    if (query.not) {
      combinedClause = "NOT (" + combinedClause + ")";
    } else {
      combinedClause = "(" + combinedClause + ")";
    }

    where.push(combinedClause);
  });

  // Add query string
  const queriesOrValues = queries.find((q) => q.key === "query")?.values;
  const queriesWhere: string[] = [];
  for (const query of queriesOrValues || []) {
    const queryStr = query.value;
    if (queryStr && queryStr.trim() && columnDefinitions.searchable_generated) {
      const queriesSubWhere = [];
      const words = queryStr.split(/[^a-z0-9]+/);
      for (const word of words) {
        if (!word.replace(/[^a-z0-9]/gm, "").trim()) continue;
        queriesSubWhere.push(
          `searchable_generated @@ to_tsquery('simple', unaccent($${counter}))`
        );
        const isLast = words.indexOf(word) === words.length - 1;
        const endsWithNumber = word.match(/\d+$/);
        values.push(word + (isLast && !endsWithNumber ? ":*" : ""));
        counter++;
      }
      if (queriesSubWhere.length) {
        queriesWhere.push("(" + queriesSubWhere.join(" AND ") + ")");
      }
    }
  }
  if (queriesWhere.length) {
    where.push("(" + queriesWhere.join(" OR ") + ")");
  }

  // Add current client_id
  where.push(`client_id = $${counter}`);
  values.push(ctx.client_id);
  counter++;

  return { where: where.length === 0 ? "1 = 1" : where.join(" AND "), values };
};

/**
 * Transform a map to the correct query format
 * @param map
 * @returns
 */
export const buildQueryFromMap = (map: { [key: string]: any }) => {
  return Object.keys(map)
    .filter(
      (k) => map[k] !== undefined && !(_.isArray(map[k]) && map[k].length === 0)
    )
    .map(
      (key) =>
        ({
          key,
          values: ((_.isArray(map[key]) ? map[key] : [map[key]]) as any[]).map(
            (v: any) => ({
              op: "equals" as RestSearchQueryOp,
              value: v,
            })
          ),
        } as RestSearchQuery)
    );
};
export const generateQueryFromMap = buildQueryFromMap;
