export type RestEntity = {
  id: string;
  is_deleted: boolean;
  client_id: string;
  revisions: number;
  created_at: string; // Stringified timestamp in ms
  created_by: string;
  updated_at: string; // Stringified timestamp in ms
  updated_by: string;
  fields: any;
  comment_id: string;
};

type SchemaKeyTypes = "text" | "date" | "boolean" | "number" | `type:${string}`;

export type SchemaType = {
  [key: string]: SchemaType | SchemaKeyTypes | [SchemaKeyTypes];
};

export type StandardResponse<T extends object> = T;

export type ErrorResponse = {
  error: string;
  message: string;
  status: number;
};

export type StandardOrErrorResponse<T extends object> =
  | StandardResponse<T>
  | ErrorResponse;

export function isErrorResponse<T extends object>(
  input: StandardOrErrorResponse<T>
): input is ErrorResponse {
  return "error" in input;
}
