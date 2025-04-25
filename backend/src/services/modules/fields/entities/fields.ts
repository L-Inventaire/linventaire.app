import { RestTableDefinition } from "../../../../platform/db/api";
import {
  classToSchema,
  schemaFromEntity,
} from "../../../../platform/schemas/utils";
import {
  RestEntity,
  RestEntityColumnsDefinition,
} from "../../../rest/entities/entity";

export class Fields extends RestEntity {
  document_type = "string";
  code = "string";
  options = "string";
  name = "string";
  type = "string";
}

export const FieldsDefinition: RestTableDefinition = {
  name: "fields",
  columns: {
    ...new RestEntityColumnsDefinition(),
    document_type: "VARCHAR(64)",
    code: "VARCHAR(64)",
    options: "TEXT",
    name: "VARCHAR(500)",
    type: "VARCHAR(64)",
  },
  pk: ["client_id", "id"],
  indexes: [["client_id", "document_type", "code"]],
  rest: {
    label: "name",
    schema: classToSchema(new Fields()),
    searchable: (field: Fields) => field.name,
  },
  auditable: true,
};

export const FieldsSchema = schemaFromEntity<Fields>(FieldsDefinition.columns);
