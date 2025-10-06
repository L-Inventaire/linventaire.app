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

export default class Articles extends RestEntity {
  assigned = ["type:users"];

  type = "string"; // Product, Service, Consumable
  internal_reference = "string";
  supplier_reference = "string";
  name = "string";
  description = "string";
  suppliers = ["type:contacts"];
  suppliers_details = { any: new SuppliersDetails() };

  price = 0;
  unit = "string";
  tva = "string";
  subscription: "" | "daily" | "monthly" | "yearly" | "weekly" = "";

  accounting = { sell: new ArticleAccounting(), buy: new ArticleAccounting() };

  notes = "string";
  documents = ["type:files"];
  tags = ["type:tags"];
}

export class ArticleAccounting {
  standard_identifier = "string"; // Numéro sur le plan comptable
  standard: "pcg" | "ifrs" = "pcg"; // Plan Comptable Général, dans le futur pourrait être étendu à d'autres standards
  name = "string";
}

export class SuppliersDetails {
  reference = "string";
  price = 0;
  delivery_time = 0; // In days
  delivery_quantity = 0; // In units
}

export const ArticlesDefinition: RestTableDefinition = {
  name: "articles",
  columns: {
    ...columnsFromEntity(Articles),

    assigned: "VARCHAR(64)[]",

    name: "TEXT",
    description: "TEXT",
    type: "VARCHAR(64)",
    internal_reference: "TEXT",
    supplier_reference: "TEXT",

    suppliers: "VARCHAR(64)[]",
    suppliers_details: "JSONB",

    price: "FLOAT",
    unit: "VARCHAR(64)",
    tva: "VARCHAR(64)",
    subscription: "VARCHAR(64)",

    notes: "TEXT",
    documents: "VARCHAR(64)[]",
    tags: "VARCHAR(64)[]",

    ...new RestEntityColumnsDefinition(),
  },
  pk: ["client_id", "id"],
  indexes: ["USING GIN (searchable_generated)"],
  auditable: true,
  rest: {
    label: (entity: Articles) =>
      entity.name +
      (entity.internal_reference ? " (" + entity.internal_reference + ")" : ""),
    searchable: (entity: Articles) => {
      return [
        Object.values(flattenKeys(_.pick(entity, ["name"]))).join(" "),
        Object.values(flattenKeys(_.pick(entity, ["internal_reference"]))).join(
          " "
        ),
        Object.values(entity.suppliers_details || [])
          .map((a) => a.reference)
          .join(" "),
        Object.values(flattenKeys(_.pick(entity, ["notes"]))).join(" "),
      ];
    },
    schema: classToSchema(new Articles()),
  },
};

export const ArticlesSchema = schemaFromEntity<Articles>(
  ArticlesDefinition.columns
);
