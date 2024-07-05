import { RestEntity } from "@features/utils/rest/types/types";

export type Tags = RestEntity & {
  client_id: string;
  id: string;
  name: string;
  color: string;
};
