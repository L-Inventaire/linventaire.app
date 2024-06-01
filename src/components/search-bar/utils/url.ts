import { SearchField } from "./types";
import { labelToVariable } from "./utils";

/**
 * This two function ensure query saved in url is language agnostic
 */

export const getFromUrl = (fields: SearchField[]) => {
  let tmp = new URLSearchParams(window.location.search).get("q") || "";
  for (const field of fields) {
    tmp = tmp.replace(
      new RegExp(field.key + ":", "gm"),
      labelToVariable(field.label || field.key) + ":"
    );
  }
  return tmp;
};

export const setToUrl = (url: URL, query: string, fields: SearchField[]) => {
  let tmp = query;
  for (const field of fields) {
    tmp = tmp.replace(
      new RegExp(labelToVariable(field.label || field.key) + ":", "gm"),
      field.key + ":"
    );
  }
  url.searchParams.set("q", tmp);
};
