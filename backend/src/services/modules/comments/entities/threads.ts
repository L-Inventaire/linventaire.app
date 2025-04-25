import {
  RestEntity,
  RestEntityColumnsDefinition,
} from "../../../rest/entities/entity";
import { RestTableDefinition } from "../../../../platform/db/api";
import {
  classToSchema,
  columnsFromEntity,
  schemaFromEntity,
} from "../../../../platform/schemas/utils";

export default class Threads extends RestEntity {
  item_entity = "string";
  item_id = "string";
  subscribers = ["type:users"];
}

export const ThreadsDefinition: RestTableDefinition = {
  name: "threads",
  columns: {
    ...columnsFromEntity(Threads),
    ...new RestEntityColumnsDefinition(),
  },
  pk: ["client_id", "item_entity", "item_id", "id"],
  rest: {
    schema: classToSchema(new Threads()),
  },
};

export const ThreadsSchema = schemaFromEntity<Threads>(
  ThreadsDefinition.columns
);
