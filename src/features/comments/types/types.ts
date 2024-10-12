import { RestEntity } from "@features/utils/rest/types/types";

export type Comments = RestEntity & {
  item_id: string;
  owner_id: string;
  content: string;
  documents: string[];
  type: "event" | "comment";
  reactions: Reactions[];
};

class Reactions {
  reaction = "string";
  users = ["string"];
}
