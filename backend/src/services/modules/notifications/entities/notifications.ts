import { RestTableDefinition } from "../../../../platform/db/api";
import {
  classToSchema,
  columnsFromEntity,
  schemaFromEntity,
} from "../../../../platform/schemas/utils";
import {
  RestEntity,
  RestEntityColumnsDefinition,
} from "../../../rest/entities/entity";
import { EventMetadatas } from "../../comments/entities/comments";

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

export default class Notifications extends RestEntity {
  user_id = "string";
  entity = "string";
  entity_id = "string";
  entity_display_name = "string";
  type: NotificationTypes = "string" as any;
  metadata: NotificationMetadatas = {} as any;
  also: AlsoType[] = [{} as any];
  last_notified_at: number = new Date().getTime();
  read = false;
}

export const NotificationsDefinition: RestTableDefinition = {
  name: "notifications",
  columns: {
    ...columnsFromEntity(Notifications),
    ...new RestEntityColumnsDefinition(),
  },
  pk: ["client_id", "user_id", "id"],
  indexes: [
    ["user_id", "client_id", "created_at", "id"],
    ["user_id", "entity", "entity_id", "read", "id"],
  ],
  rest: {
    label: () => "",
    schema: classToSchema(new Notifications()),
  },
};

export const NotificationsSchema = schemaFromEntity<Notifications>(
  NotificationsDefinition.columns
);
