import { RestTableDefinition } from "../../../../platform/db/api";
import {
  classToSchema,
  schemaFromEntity,
} from "../../../../platform/schemas/utils";
import {
  RestEntity,
  RestEntityColumnsDefinition,
} from "../../../rest/entities/entity";

export default class DataAnalysis extends RestEntity {
  email = "string";
  external_id = "string";
}

export const DataAnalysisDefinition: RestTableDefinition = {
  name: "data_analysis",
  columns: {
    ...new RestEntityColumnsDefinition(),
    email: "VARCHAR(128)",
    external_id: "VARCHAR(128)",
  },
  pk: ["email", "id"],
  indexes: ["USING GIN (searchable_generated)"],
  auditable: true,
  rest: {
    schema: classToSchema(new DataAnalysis()),
  },
};

export const DataAnalysisSchema = schemaFromEntity<DataAnalysis>(
  DataAnalysisDefinition.columns
);
