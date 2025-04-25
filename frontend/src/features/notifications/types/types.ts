import { EventMetadatas } from "@features/comments/types/types";
import { RestEntity } from "@features/utils/rest/types/types";

export type NotificationTypes =
  | "mentioned" // You were mentioned
  | "assigned" // The entity was assigned to someone (you're subscribed in this case) or to you

  // Need to be subscribed, or have the option "notify me on all changes of this type"
  | "modified" // The entity was modified
  | "commented" // Someone commented on the entity
  | EventMetadatas["event_type"];

type NotificationMetadatas =
  | {
      by: string;
      by_name: string;
      by_email: string;
      field?: string;
      assigned?: string;
      assigned_name?: string;
      assigned_email?: string;
      content?: string;
    }
  | EventMetadatas;

type AlsoType = {
  type: NotificationTypes;
  metadata: NotificationMetadatas;
};

export type Notifications = RestEntity & {
  user_id: string;
  entity: string;
  entity_id: string;
  entity_display_name: string;
  type: NotificationTypes;
  metadata: NotificationMetadatas;
  also: AlsoType[];
  last_notified_at: number;
  read: boolean;
};

export type NotificationsPreferences = RestEntity & {
  user_id: string;
  always_notified: string[];
};
