export function flattenKeys(object: any, initialPathPrefix = ""): any {
  if (!object || typeof object !== "object") {
    return [{ [initialPathPrefix]: object }];
  }

  const prefix = initialPathPrefix
    ? Array.isArray(object)
      ? initialPathPrefix
      : `${initialPathPrefix}.`
    : "";

  return Object.keys(object)
    .flatMap((key) =>
      flattenKeys(
        object[key],
        Array.isArray(object) ? `${prefix}[${key}]` : `${prefix}${key}`
      )
    )
    .reduce((acc, path) => ({ ...acc, ...path }));
}
