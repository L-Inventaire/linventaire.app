import { TableDefinition } from "../../../../platform/db/api";
import {
  classToSchema,
  columnsFromEntity,
  schemaFromEntity,
} from "../../../../platform/schemas/utils";
import {
  RestEntity,
  RestEntityColumnsDefinition,
} from "../../../rest/entities/entity";
import { NotificationTypes } from "./notifications";

export class NotificationsPreferences extends RestEntity {
  user_id = "string";
  always_notified: NotificationTypes[] = ["assigned"];
}

export const NotificationsPreferencesDefinition: TableDefinition = {
  name: "notifications_preferences",
  columns: {
    ...columnsFromEntity(NotificationsPreferences),
    ...new RestEntityColumnsDefinition(),
  },
  pk: ["client_id", "user_id", "id"],
  rest: {
    label: () => "",
    schema: classToSchema(new NotificationsPreferences()),
  },
};

export const NotificationsPreferencesSchema =
  schemaFromEntity<NotificationsPreferences>(
    NotificationsPreferencesDefinition.columns
  );
