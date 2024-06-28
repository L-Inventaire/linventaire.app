import { RestSearchQuery } from "@features/utils/rest/hooks/use-rest";
import { SchemaType } from "@features/utils/rest/types/types";
import _ from "lodash";
import { getFromUrl } from "./url";
import { extractFilters, generateQuery, schemaToSearchFields } from "./utils";

export const withSearchAsModelObj = <T>(
  schema: SchemaType,
  model?: Partial<T>,
  filters?: RestSearchQuery[],
  opt?: { keepArraysFirst?: boolean }
) => {
  if (schema) {
    const _model = {};
    (filters || []).forEach((filter) => {
      const isArray = _.isArray(_.get(schema, filter.key));
      const isBoolean =
        (isArray ? _.get(schema, filter.key)[0] : _.get(schema, filter.key)) ===
        "boolean";
      if (_.get(schema, filter.key)) {
        if (!isBoolean && filter.not) return; // Can't set not on non boolean
        if (isBoolean && isArray) return; // Can't set both true and false
        if (!isArray && filter.values.length > 1 && !opt?.keepArraysFirst)
          return; // Can't set multiple values on non array

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

  return model;
};

/**
 * Will convert search filters to a model in url to start the new object
 * @param route
 * @param model part of the model we'll force
 * @param search
 */
export const withSearchAsModel = <T>(
  route: string,
  schema?: SchemaType,
  model?: Partial<T>,
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
    model = withSearchAsModelObj(schema, model, filters.fields);
  }

  return (
    parts[0] +
    "?" +
    (parts[1] ? parts[1] + "&" : "") +
    "model=" +
    encodeURIComponent(JSON.stringify(model))
  );
};

export const withModel = <T>(route: string, model?: Partial<T>) => {
  return withSearchAsModel(route, undefined, model);
};
