import { SchemaType } from "@features/utils/rest/types/types";
import _ from "lodash";
import { extractFilters, generateQuery, schemaToSearchFields } from "./utils";
import { getFromUrl } from "./url";

/**
 * Will convert search filters to a model in url to start the new object
 * @param route
 * @param model part of the model we'll force
 * @param search
 */
export const withSearchAsModel = (
  route: string,
  schema?: SchemaType,
  model?: any,
  search?: string
) => {
  const parts = route.split("?");

  if (schema) {
    const currentFilters = search || getFromUrl([]);
    const filters = generateQuery(
      schemaToSearchFields(schema),
      extractFilters(currentFilters),
      JSON.parse(new URLSearchParams(window.location.search).get("map") || "{}")
    );
    const _model = {};
    filters.fields.forEach((filter) => {
      const isArray = _.isArray(_.get(schema, filter.key));
      const isBoolean =
        (isArray ? _.get(schema, filter.key)[0] : _.get(schema, filter.key)) ===
        "boolean";
      if (_.get(schema, filter.key)) {
        if (!isBoolean && filter.not) return; // Can't set not on non boolean
        if (isBoolean && isArray) return; // Can't set both true and false
        if (!isArray && filter.values.length > 1) return; // Can't set multiple values on non array
        // Only keep equals filters
        const eqValues = filter.values.filter(
          (v) => v.op === "equals" || v.op === "regex"
        );
        if (!eqValues.length) return;
        let value = isArray ? eqValues.map((a) => a.value) : eqValues[0].value;
        if (isBoolean && filter.not) value = !value;

        // AND filters
        const existingValue = _.get(_model, filter.key);
        if (isArray && existingValue) {
          value = _.uniq([...existingValue, ...value]);
        }

        // All good, set the value
        _.set(_model, filter.key, value);
      }
    });
    model = { ..._model, ...model };
  }

  return (
    parts[0] +
    "?" +
    (parts[1] ? parts[1] + "&" : "") +
    "model=" +
    encodeURIComponent(JSON.stringify(model))
  );
};
