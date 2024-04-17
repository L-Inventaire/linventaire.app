import { RestSearchQuery } from "@features/utils/rest/hooks/use-rest";

type ConcatenatedString<T extends string, S extends string> = `${T}${S}`;

export type SearchField = {
  label: string;
  key: string;
  type:
    | "text"
    | "date"
    | "number"
    | "boolean"
    | ConcatenatedString<"type:", string>;
  search?: (query: string) => Promise<{ value: any; label: string }[]>;
};

export type MatchedStringFilter = {
  key: string;
  not: boolean;
  raw: string;
  values: string[];
  values_raw: string;
  values_raw_array: string[];
};

export type MatchedStringValue = {
  index: number;
};

export type OutputQuery = {
  valid: boolean;
  fields: RestSearchQuery[];
};
