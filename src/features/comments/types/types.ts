export type Comments = {
  client_id: string;
  item_id: string;
  id: string;
  owner_id: string;
  created_at: Date;
  edited_at: Date;
  content: string;
  type: "event" | "comment";
};
