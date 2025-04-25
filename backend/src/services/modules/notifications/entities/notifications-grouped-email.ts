import { TableDefinition } from "../../../../platform/db/api";
import {
  columnsFromEntity,
  schemaFromEntity,
} from "../../../../platform/schemas/utils";

export class NotificationsGroupedEmails {
  client_id = "string";
  created_at = new Date();
  user_id = "string";
  notifications: string[] = ["string"];
}

export const NotificationsGroupedEmailsDefinition: TableDefinition = {
  name: "notifications_grouped_emails",
  columns: {
    ...columnsFromEntity(NotificationsGroupedEmails),
  },
  pk: ["client_id", "user_id"],
};

export const NotificationsGroupedEmailsSchema =
  schemaFromEntity<NotificationsGroupedEmails>(
    NotificationsGroupedEmailsDefinition.columns
  );
