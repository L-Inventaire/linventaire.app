import { RestSearchQuery } from "@features/utils/rest/hooks/use-rest";
import { SchemaType } from "@features/utils/rest/types/types";
import _ from "lodash";
import { getFromUrl } from "./url";
import { extractFilters, generateQuery, schemaToSearchFields } from "./utils";

export const withSearchAsModelObj = <T>(
  schema: SchemaType,
  model?: Partial<T>,
  filters?: RestSearchQuery[],
  opt?: { keepArraysFirst?: boolean },
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
          (v) => v.op === "equals" || v.op === "regex",
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
  search?: string,
) => {
  const parts = route.split("?");

  if (schema) {
    const currentFilters = search || getFromUrl([]);
    const filters = generateQuery(
      schemaToSearchFields(schema),
      extractFilters(currentFilters),
      JSON.parse(
        new URLSearchParams(window.location.search).get("map") || "{}",
      ),
    );
    model = withSearchAsModelObj(schema, model, filters.fields);
  }

  if (model) {
    // _cache_model_id serve in case url is too long
    (model as any)._cache_model_id = Date.now();
    localStorage.setItem("url_model", JSON.stringify(model));
  }

  const base =
    parts[0] +
    "?" +
    (parts[1] ? parts[1] + "&" : "") +
    "mid=" +
    (model as any)?._cache_model_id;

  const withModelUrl =
    base + "&model=" + encodeURIComponent(JSON.stringify(model));

  // Only embed the full model in the URL when it stays short enough. Large
  // models (e.g. a grouped invoice with many lines) would otherwise blow past
  // the server's URL length limit and trigger a 414. In that case we drop the
  // `model` param and rely on the localStorage copy, looked up by `mid`.
  const MAX_URL_LENGTH = 2000;
  return !model || withModelUrl.length <= MAX_URL_LENGTH ? withModelUrl : base;
};

export const withModel = <T>(route: string, model?: Partial<T>) => {
  return withSearchAsModel(route, undefined, model);
};

export const getUrlModel = <T>() => {
  const val = new URLSearchParams(window.location.search).get("model");
  const mid = new URLSearchParams(window.location.search).get("mid");

  // Prefer the model embedded in the URL when present and valid.
  if (val) {
    try {
      return JSON.parse(val) as T;
    } catch (e: any) {
      console.error(e);
    }
  }

  // Otherwise fall back to the localStorage copy, matched by `mid`. This is the
  // case when the model was too large to embed in the URL (see withSearchAsModel).
  if (mid) {
    try {
      const tmp = JSON.parse(localStorage.getItem("url_model") || "{}") as T;
      // `_cache_model_id` is a number, `mid` a string from the URL: compare as strings.
      if (String((tmp as any)?._cache_model_id) === String(mid)) return tmp;
    } catch (e: any) {
      console.error(e);
    }
  }

  return {} as T;
};
