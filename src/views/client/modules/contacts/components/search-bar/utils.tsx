import {
  MatchedStringFilter,
  OutputQuery,
  OutputQueryOp,
  SearchField,
} from "./types";

export const labelToVariable = (label: string) =>
  label.toLowerCase().replace(/[^a-z0-9]/g, "_");

// Filters have this form: field:"value with spaces","value2","value3" or just field:value,value2
export const extractFilters = (str: string): MatchedStringFilter[] => {
  const filters =
    str.match(/(!?[^ :]+:~?([^" ]+|("[^"]+("|$),?)+[^" ]*)|[^ ]+)/gm) || [];
  return filters.map((filter) => {
    const parts = filter.match(
      /(([^ :]+):(~?[^~" ]+|(~?"[^"]+("|$),?)+[^" ]*)?)/
    );
    if (!parts)
      return { key: "", not: false, raw: filter, values: [], values_raw: "" };
    const key = parts[2];
    const values = (parts[3] || "").match(/(~?"[^"]+("|$)|[^,]+)/g) || [];
    return {
      key: key.replace(/^!/, ""),
      not: key.startsWith("!"),
      raw: filter,
      values_raw: parts[3] || "",
      values: values
        .map((value) => value.replace(/^"(.*?)("|$)$/g, "$1"))
        .filter(Boolean),
    };
  });
};

export const generateQuery = (
  fields: SearchField[],
  filters: MatchedStringFilter[]
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
      values: [{ op: "equals" as OutputQueryOp, value: query }],
    },
    ...filters
      .filter((a) => a.key)
      .map((a) => {
        const field = fields.find((b) => labelToVariable(b.label) === a.key);
        return {
          key: field?.key || a.key,
          not: a.not,
          values: a.values.map((value) => {
            if (field?.type === "text") {
              const isRegex = value.startsWith("~");
              value = value.replace(/(^~?"|"$)/g, "");
              return {
                op: (isRegex ? "regex" : "equals") as OutputQueryOp,
                value,
              };
            } else if (field?.type === "boolean") {
              return {
                op: "equals" as OutputQueryOp,
                value: value === "1",
              };
            } else if (field?.type === "number" || field?.type === "date") {
              let [min, max] = value.split("->") as [
                string | number | Date | null,
                string | number | Date | null
              ];

              if (field?.type === "date") {
                min = min ? new Date(min) : null;
                max = max ? new Date(max) : null;
              } else {
                min = min ? parseFloat(min as string) : null;
                max = max ? parseFloat(max as string) : null;

                if (isNaN(min as number)) min = null;
                if (isNaN(max as number)) max = null;
              }

              if (value.startsWith(">=")) {
                return {
                  op: "gte" as OutputQueryOp,
                  value: min,
                };
              }
              if (value.startsWith("<=")) {
                return {
                  op: "lte" as OutputQueryOp,
                  value: min,
                };
              }
              if (value.includes("->")) {
                return {
                  op: "range" as OutputQueryOp,
                  value: [min, max],
                };
              }
              return {
                op: "equals" as OutputQueryOp,
                value: min,
              };
            } else {
              valid = false;
            }
            return { op: "equals" as OutputQueryOp, value };
          }),
        };
      }),
  ];

  return {
    valid,
    fields: result,
  };
};
