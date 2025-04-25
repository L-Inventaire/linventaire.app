import _ from "lodash";
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
import { flattenKeys } from "../../../utils";

export default class ServiceItems extends RestEntity {
  state:
    | "backlog"
    | "todo"
    | "in_progress"
    | "in_review"
    | "done"
    | "cancelled" = "todo";

  title = "string";
  article = "type:articles";
  quantity_expected = 0; // In hours
  quantity_spent = 0; // Precomputed: In hours, computed from service times
  started_at = new Date();

  client = "type:contacts"; // The client who has this service or plan to have it
  for_rel_quote = "type:invoices"; // The quote or invoice this service is linked to
  for_no_quote = false; // This service item is purposely not linked to a quote

  from_rel_original_service_item = "type:service_items"; // Sub tasks

  assigned = ["type:users"];
  notes = "string";
  documents = ["type:files"]; // Internal documents linked to the service
  tags = ["type:tags"];

  cache = {
    article_name: "string",
    client_name: "string",
    quote_name: "string",
  };
}

export const ServiceItemsDefinition: RestTableDefinition = {
  name: "service_items",
  columns: {
    ...columnsFromEntity(ServiceItems),
    ...new RestEntityColumnsDefinition(),
    notes: "TEXT",
    state_order:
      "BIGINT GENERATED ALWAYS AS (CASE state WHEN 'backlog' THEN 1 WHEN 'todo' THEN 2 WHEN 'in_progress' THEN 3 WHEN 'in_review' THEN 4 WHEN 'done' THEN 5 WHEN 'cancelled' THEN 6 ELSE 7 END) STORED",
  },
  pk: ["client_id", "id"],
  indexes: ["USING GIN (searchable_generated)"],
  auditable: true,
  rest: {
    label: (entity: ServiceItems) => entity.title || entity.notes,
    searchable: (entity: ServiceItems) => {
      return [
        ...Object.values(flattenKeys(_.pick(entity, ["title", "notes"]))),
        entity.cache?.article_name || "",
        entity.cache?.client_name || "",
        entity.cache?.quote_name || "",
      ].join(" ");
    },
    schema: classToSchema(new ServiceItems()),
  },
};

export const ServiceItemsSchema = schemaFromEntity<ServiceItems>(
  ServiceItemsDefinition.columns
);
