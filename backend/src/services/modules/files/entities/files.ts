import { RestTableDefinition } from "../../../../platform/db/api";
import {
  classToSchema,
  schemaFromEntity,
} from "../../../../platform/schemas/utils";
import {
  RestEntity,
  RestEntityColumnsDefinition,
} from "../../../rest/entities/entity";

export class Files extends RestEntity {
  rel_table = "string"; // Even when not related to anything, this wont be empty string (used in S3 path)
  rel_id = "string";
  rel_field = "string";
  rel_unreferenced = false;

  key = "string";
  name = "string";
  mime = "string";
  size = 0;
  has_thumbnail = false;
}

export const FilesDefinition: RestTableDefinition = {
  name: "files",
  columns: {
    ...new RestEntityColumnsDefinition(),
    rel_table: "VARCHAR(64)",
    rel_id: "VARCHAR(64)",
    rel_field: "VARCHAR(64)",
    rel_unreferenced: "BOOLEAN",
    key: "VARCHAR(64)",
    name: "VARCHAR(500)",
    mime: "VARCHAR(128)",
    size: "BIGINT",
    has_thumbnail: "BOOLEAN",
  },
  pk: ["client_id", "id"],
  indexes: [
    ["client_id", "rel_table", "rel_id", "rel_field", "id"],
    ["client_id", "key"],
  ],
  rest: {
    label: "name",
    schema: classToSchema(new Files()),
    searchable: (file: Files) => file.name,
  },
  auditable: true,
};

export const FilesSchema = schemaFromEntity<Files>(FilesDefinition.columns);
