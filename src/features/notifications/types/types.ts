import { RestEntity } from "@features/utils/rest/types/types";

export type Notifications = RestEntity & {
  user_id: string;
  content: string;
  url: string;
  read: boolean;
};
