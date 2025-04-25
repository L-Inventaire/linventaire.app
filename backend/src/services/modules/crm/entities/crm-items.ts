import _ from "lodash";
import { RestTableDefinition } from "../../../../platform/db/api";
import {
  classToSchema,
  columnsFromEntity,
  schemaFromEntity,
} from "../../../../platform/schemas/utils";
import { flattenKeys } from "../../../utils";
import {
  RestEntity,
  RestEntityColumnsDefinition,
} from "../../../rest/entities/entity";

export default class CRMItems extends RestEntity {
  contacts = ["type:contacts"];
  notes = "string";
  contact_summaries = [new ContactSummary()];
  state: "new" | "qualified" | "proposal" | "won" | "lost" = "new";
  seller = "type:users";
  assigned = ["type:users"];
  tags = ["type:tags"];
}

export class ContactSummary {
  person_first_name = "string";
  person_last_name = "string";
  business_name = "string";
  business_registered_name = "string";
}

export const CRMItemsDefinition: RestTableDefinition = {
  name: "crm_items",
  columns: {
    ...columnsFromEntity(CRMItems),
    ...new RestEntityColumnsDefinition(),
    state: "VARCHAR(500)",
    notes: "TEXT",
  },
  pk: ["client_id", "id"],
  indexes: ["USING GIN (searchable_generated)"],
  auditable: true,
  rest: {
    label: (entity: CRMItems) =>
      [
        (entity?.contact_summaries || [])
          .map((sum) => [
            sum?.person_first_name,
            sum?.person_last_name,
            sum?.business_name || sum?.business_registered_name,
          ])
          .filter(Boolean)
          .join(" "),
        // Strip tags from notes
        entity?.notes?.replace(/<[^>]*>?/gm, ""),
      ].join(" - "),
    searchable: (entity: CRMItems) => {
      return Object.values(
        flattenKeys(_.pick(entity, ["contact_summaries", "notes"]))
      ).join(" ");
    },
    schema: classToSchema(new CRMItems()),
  },
};

export const CRMItemsSchema = schemaFromEntity<CRMItems>(
  CRMItemsDefinition.columns
);
