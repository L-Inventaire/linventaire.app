import Big from "big.js";
import { randomInt } from "crypto";
import _ from "lodash";
import { Condition } from "./api";

export const getWhereClause = <Entity>(
  condition: Condition<Entity>,
  existingValuesCount = 0
) => {
  // Use lodash to remove any undeinfed values
  condition = _.omitBy(condition, _.isUndefined);
  const values: any[] = [];
  let whereClause = "";
  if ("where" in condition && "values" in condition) {
    // Protect query a bit (it should also be done before this point!)
    if (
      condition.where.includes(";") ||
      condition.where.includes("DROP") ||
      condition.where.includes("DELETE") ||
      condition.where.includes("UPDATE") ||
      condition.where.includes("INSERT")
    ) {
      throw new Error("Invalid query");
    }

    whereClause = `WHERE ${condition.where}`;
    values.push(...condition.values);
  } else {
    const conditionKeys = Object.keys(condition);
    if (conditionKeys.length) {
      const conditionPlaceholders = conditionKeys.map(
        (key, idx) =>
          `${key} = ${_.isArray(condition[key]) ? "ANY" : ""} ($${
            values.length + idx + 1 + existingValuesCount
          })`
      );
      whereClause = `WHERE ${conditionPlaceholders.join(" AND ")}`;
      values.push(...Object.values(condition));
    }
  }
  return { clause: whereClause, values };
};

export const sanitizeDocument = <Entity>(document: Entity) => {
  if (document && typeof document === "object") {
    Object.keys(document).forEach((k) => {
      if (document[k] instanceof Big) {
        document[k] = document[k].toString();
      } else if (typeof document[k] === "object") {
        document[k] = sanitizeDocument(document[k]);
      }
    });
  }

  return document;
};

export const sanitizeCondition = <Entity>(condition: Entity) => {
  return sanitizeDocument(condition);
};

// Ids are the base 36 of (milliseconds × 1 000 000 + a sub-millisecond part), so they sort by
// creation date. The sub-millisecond part is random: two ids created in the same millisecond by
// different processes have a 1 in 1 000 000 chance of colliding; within a process ids strictly
// increase. Computed with BigInt: the value is above Number.MAX_SAFE_INTEGER, and with numbers
// the low digits were rounded (to 256) so concurrent creations often got the same id.
let lastId = BigInt(0);
export const id = () => {
  let value =
    BigInt(Date.now()) * BigInt(1000000) + BigInt(randomInt(1000000));
  if (value <= lastId) value = lastId + BigInt(1);
  lastId = value;
  return value.toString(36).padStart(12, "0");
};
