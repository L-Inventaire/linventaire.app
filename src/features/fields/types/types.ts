export type Fields = {
  client_id: string;
  document_type: string;
  id: string;
  code: string;
  name: string;
  type: "text" | "number" | "boolean" | "date" | "type:users" | "type:tags";
};
