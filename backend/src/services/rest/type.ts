export type RestSearchQueryOp = "equals" | "regex" | "gte" | "lte" | "range";

export type RestSearchQuery = {
  key: string;
  not?: boolean; // Invert the query
  empty?: boolean; // We want to find empty values (empty lists, empty strings, nulls)
  values: { op: RestSearchQueryOp; value: any }[];
};
