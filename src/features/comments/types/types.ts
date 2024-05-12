export type Comments = {
  client_id: string;
  item_id: string;
  id: string;
  owner_id: string;
  created_at: number;
  edited_at: number;
  content: string;
  type: "event" | "comment";
};
