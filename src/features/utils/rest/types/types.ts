export type RestEntity = {
  id: string;
  client_id: string;
  revisions: number;
  created_at: string; // Stringified timestamp in ms
  created_by: string;
  updated_at: string; // Stringified timestamp in ms
  updated_by: string;
  fields: any;
};

type SchemaKeyTypes = "text" | "date" | "boolean" | "number" | `type:${string}`;

export type SchemaType = {
  [key: string]: SchemaType | SchemaKeyTypes | [SchemaKeyTypes];
};
