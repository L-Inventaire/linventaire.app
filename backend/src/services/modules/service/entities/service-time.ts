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

export default class ServiceTimes extends RestEntity {
  description = "string";
  quantity = 0;
  unit = "string";
  date = new Date();
  service = "type:service_items";
  assigned = ["type:users"];
}

export const ServiceTimesDefinition: RestTableDefinition = {
  name: "service_times",
  columns: {
    ...columnsFromEntity(ServiceTimes),
    ...new RestEntityColumnsDefinition(),
    notes: "TEXT",
  },
  pk: ["client_id", "id"],
  indexes: ["USING GIN (searchable_generated)"],
  auditable: true,
  rest: {
    label: (entity: ServiceTimes) => entity.description,
    searchable: (entity: ServiceTimes) => {
      return Object.values(flattenKeys(_.pick(entity, ["name"]))).join(" ");
    },
    schema: classToSchema(new ServiceTimes()),
  },
};

export const ServiceTimesSchema = schemaFromEntity<ServiceTimes>(
  ServiceTimesDefinition.columns
);
