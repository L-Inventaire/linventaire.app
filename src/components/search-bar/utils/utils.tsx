import {
  RestSearchQuery,
  RestSearchQueryOp,
} from "@features/utils/rest/hooks/use-rest";
import { MatchedStringFilter, OutputQuery, SearchField } from "./types";
import { flattenKeys } from "@features/utils/flatten";
import { getPeriodEnd } from "@features/utils/format/dates";
import _ from "lodash";

export const schemaToSearchFields = (
  schema: any,
  translations: {
    [key: string]:
      | boolean
      | string
      | { label: string; keywords: string; values?: { [key: string]: {} } };
  } = {}
) => {
  if (Object.keys(schema || {}).length === 0) return [];
  return Object.entries(flattenKeys(schema))
    .filter(([key]) => translations[key] !== false)
    .map(([key, value]) => {
      key = key.replace(/\[0\]$/, "");
      const tr =
        typeof translations[key] === "string"
          ? { label: translations[key], keywords: translations[key] }
          : (translations[key] as any);
      return {
        key,
        label: tr?.label || key,
        keywords: [...(tr?.keywords || "").split(" "), key, tr?.label]
          .filter((a) => a)
          .map((a) =>
            a
              .toLocaleLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
          ),
        type: value as SearchField["type"],
        values: (translations?.[key] as any)?.values || {},
      };
    });
};

export const labelToVariable = (label: string) =>
  label
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "_");

// Filters have this form: field:"value with spaces","value2","value3" or just field:value,value2
export const extractFilters = (str: string): MatchedStringFilter[] => {
  const filters =
    str.match(/(!?[^ :]+:~?([^" ]+|("[^"]*("|$),?)+[^" ]*)|[^ ]+)/gm) || [];
  return filters.map((filter) => {
    const parts = filter.match(
      /(([^ :]+):(~([^"]|$)|~?[^~" ]+|(~?"[^"]*("|$),?)+[^" ]*)?)/
    );
    if (!parts)
      return {
        key: "",
        not: false,
        regex: false,
        raw: filter,
        values: [],
        values_raw: "",
        values_raw_array: [],
      };
    const key = parts[2];
    const values =
      (parts[3] || "").match(/(~([^"]|$)|~?"[^"]*("|$)|[^,]+)/g) || [];
    return {
      key: key.replace(/^!/, ""),
      not: key.startsWith("!"),
      regex: (parts[3] || "").startsWith("~"),
      raw: filter,
      values_raw: parts[3] || "",
      values: values
        .map((value) => value.replace(/^~?"(.*?)("|$)$/g, "$1"))
        .filter(Boolean),
      values_raw_array: [
        ...values,
        ...((parts[3] || "").match(/,$/) ? [""] : []),
      ],
    };
  });
};

export const generateQuery = (
  fields: SearchField[],
  filters: MatchedStringFilter[],
  replacementsMap?: { [key: string]: string }
): OutputQuery => {
  const query = filters
    .filter((a) => !a.key)
    .map((a) => a.raw)
    .join(" ");

  let valid = true;
  const result = [
    {
      key: "query",
      not: false,
      regex: false,
      values: [{ op: "equals" as RestSearchQueryOp, value: query }],
    },
    ...filters
      .filter((a) => a.key)
      .map((a) => {
        const field = fields.find((b) => labelToVariable(b.label) === a.key);
        return {
          key: field?.key || a.key,
          not: a.not,
          regex: a.regex,
          values: a.values.map((value) => {
            value =
              replacementsMap?.[(field?.key || a.key) + ":" + value] || value;
            if (field?.type === "text" || field?.type?.indexOf("type:") === 0) {
              const isRegex = a.regex;
              value = value.replace(/(^~?"|"$)/g, "");
              return {
                op: (isRegex ? "regex" : "equals") as RestSearchQueryOp,
                value,
              };
            } else if (field?.type === "boolean") {
              return {
                op: "equals" as RestSearchQueryOp,
                value: value === "1",
              };
            } else if (field?.type === "number" || field?.type === "date") {
              // If only a value without anything else and it is a date, we automatically apply a range
              if (
                value.match(/^[0-9]/) &&
                value.indexOf("->") < 0 &&
                field?.type === "date"
              ) {
                value = `${value}->${value}`;
              }

              let [min, max] = value.split("->") as [
                string | number | Date | null,
                string | number | Date | null
              ];

              if (field?.type === "date") {
                min = min ? new Date(min) : null;
                // For max we apply a special treatment to *include* it
                max = max ? new Date(getPeriodEnd(max as string)) : null;
              } else {
                min = min ? parseFloat(min as string) : null;
                max = max ? parseFloat(max as string) : null;

                if (isNaN(min as number)) min = null;
                if (isNaN(max as number)) max = null;
              }

              if (value.startsWith(">=")) {
                return {
                  op: "gte" as RestSearchQueryOp,
                  value: min,
                };
              }
              if (value.startsWith("<=")) {
                return {
                  op: "lte" as RestSearchQueryOp,
                  value: min,
                };
              }
              if (value.includes("->")) {
                return {
                  op: "range" as RestSearchQueryOp,
                  value: [min, max],
                };
              }
              return {
                op: "equals" as RestSearchQueryOp,
                value: min,
              };
            } else {
              valid = false;
            }
            return { op: "equals" as RestSearchQueryOp, value };
          }),
        };
      }),
  ];

  return {
    valid,
    fields: result,
  };
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
