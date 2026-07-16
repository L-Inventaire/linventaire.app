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

const URL_MODEL_PREFIX = "url_model_";

// Guarantees a unique id even when several models are generated within the same
// millisecond (e.g. multiple `to=` links rendered in one pass).
let modelIdCounter = 0;
const nextModelId = () => Date.now() * 1000 + modelIdCounter++;

// Keep the localStorage from growing without bound while never dropping the
// entry the active page still needs (the one matching `keepMid`, or the one
// referenced by the current URL). Also clears the legacy single-slot key.
const cleanupUrlModels = (keepMid: number) => {
  try {
    localStorage.removeItem("url_model");

    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(URL_MODEL_PREFIX)) keys.push(k);
    }

    const MAX_ENTRIES = 20;
    if (keys.length <= MAX_ENTRIES) return;

    const currentMid = new URLSearchParams(window.location.search).get("mid");
    const protectedKeys = new Set([
      URL_MODEL_PREFIX + keepMid,
      currentMid ? URL_MODEL_PREFIX + currentMid : "",
    ]);

    // Oldest first (numeric suffix is a timestamp-based id).
    keys.sort(
      (a, b) =>
        Number(a.slice(URL_MODEL_PREFIX.length)) -
        Number(b.slice(URL_MODEL_PREFIX.length)),
    );

    let toRemove = keys.length - MAX_ENTRIES;
    for (const k of keys) {
      if (toRemove <= 0) break;
      if (protectedKeys.has(k)) continue;
      localStorage.removeItem(k);
      toRemove--;
    }
  } catch (e: any) {
    console.error(e);
  }
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
    const mid = nextModelId();
    (model as any)._cache_model_id = mid;
    try {
      // Store under a per-id key. `withSearchAsModel` is evaluated inside `to=`
      // props during render (e.g. the sidebar "new" buttons), so a single shared
      // key would get clobbered by any other component rendering on the same
      // page before `getUrlModel` reads it. A per-id key isolates each model.
      localStorage.setItem(URL_MODEL_PREFIX + mid, JSON.stringify(model));
      cleanupUrlModels(mid);
    } catch (e: any) {
      console.error(e);
    }
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

  // Otherwise fall back to the localStorage copy, looked up by its per-id key.
  // This is the case when the model was too large to embed in the URL (see
  // withSearchAsModel).
  if (mid) {
    try {
      const raw = localStorage.getItem(URL_MODEL_PREFIX + mid);
      if (raw) return JSON.parse(raw) as T;
    } catch (e: any) {
      console.error(e);
    }
  }

  return {} as T;
};
