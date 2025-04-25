import _ from "lodash";

export const formatSearchValues = (v: any) =>
  _.transform(v, (result: any, value, key) => {
    if (_.isDate(value)) {
      result[key] = value.toISOString().split("T")[0];
    } else if (typeof value === "object") {
      result[key] = value.value;
    } else {
      result[key] = value;
    }
  });
