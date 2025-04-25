import { RestTableDefinition } from "../../../../platform/db/api";
import {
  classToSchema,
  schemaFromEntity,
} from "../../../../platform/schemas/utils";
import {
  RestEntity,
  RestEntityColumnsDefinition,
} from "../../../rest/entities/entity";

export class Tags extends RestEntity {
  name = "string";
  color = "string";
}

export const TagsDefinition: RestTableDefinition = {
  name: "tags",
  columns: {
    ...new RestEntityColumnsDefinition(),
    name: "VARCHAR(64)",
    color: "VARCHAR(64)",
  },
  pk: ["client_id", "id"],
  rest: {
    label: "name",
    schema: classToSchema(new Tags()),
    searchable: (tag: Tags) => tag.name,
  },
  auditable: true,
};

export const TagsSchema = schemaFromEntity<Tags>(TagsDefinition.columns);
