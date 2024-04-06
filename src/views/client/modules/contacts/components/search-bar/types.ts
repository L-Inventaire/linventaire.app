export type SearchField = {
  label: string;
  key: string;
  type: "text" | "date" | "number" | "boolean";
  search?: (query: string) => Promise<{ value: any; label: string }[]>;
};

export type MatchedStringFilter = {
  key: string;
  not: boolean;
  raw: string;
  values: string[];
  values_raw: string;
};

export type OutputQueryOp = "equals" | "regex" | "gte" | "lte" | "range";

export type OutputQuery = {
  key: string;
  not?: boolean;
  values: { op: OutputQueryOp; value: any }[];
}[];
