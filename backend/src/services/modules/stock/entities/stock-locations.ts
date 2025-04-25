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

export default class StockLocations extends RestEntity {
  type: "warehouse" | "shelf" = "warehouse";
  name = "string";
  parent = "type:stock_locations";
}

export const StockLocationsDefinition: RestTableDefinition = {
  name: "stock_locations",
  columns: {
    ...columnsFromEntity(StockLocations),
    ...new RestEntityColumnsDefinition(),
    notes: "TEXT",
  },
  pk: ["client_id", "id"],
  indexes: ["USING GIN (searchable_generated)"],
  auditable: true,
  rest: {
    label: (entity: StockLocations) => entity.name,
    searchable: (entity: StockLocations) => {
      return Object.values(flattenKeys(_.pick(entity, ["name"]))).join(" ");
    },
    schema: classToSchema(new StockLocations()),
  },
};

export const StockLocationsSchema = schemaFromEntity<StockLocations>(
  StockLocationsDefinition.columns
);
