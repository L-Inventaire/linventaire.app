import _ from "lodash";
import { RestTableDefinition } from "../../../../platform/db/api";
import {
  classToSchema,
  columnsFromEntity,
  schemaFromEntity,
} from "../../../../platform/schemas/utils";
import { flattenKeys } from "../../../../services/utils";
import {
  Address,
  InvoiceFormat,
  InvoiceSubscription,
  Payment,
  Preferences,
} from "../../../clients/entities/clients";
import {
  RestEntity,
  RestEntityColumnsDefinition,
} from "../../../rest/entities/entity";

export default class Contacts extends RestEntity {
  favorite = false;

  is_supplier = false; // Is this contact a supplier
  is_client = false; // Is this contact a user

  // This defines other contacts the contact is working for
  has_parents = false; // Is this contact a subcontact
  parents = ["type:contacts"];
  parents_roles: { [key: string]: ParentContactRole } = {
    any: new ParentContactRole(),
  };

  type: "person" | "company" = "company";

  business_name = "string";
  business_registered_name = "string";
  business_registered_id = "string";
  business_tax_id = "string";

  person_first_name = "string";
  person_last_name = "string";

  language = "string";
  currency = "string";

  email = "string";
  emails = ["string"];
  phone = "string";
  phones = ["string"];
  address = new Address();
  other_addresses = {
    delivery: new Address(),
    billing: new Address(),
    other: new Address(),
  };
  billing = new Billing();

  // Overrides of the Client preferences
  invoices = new InvoiceFormat();
  payment = new Payment();
  recurring = new InvoiceSubscription();
  preferences = new Preferences();

  notes = "string";
  documents = ["type:files"];
  tags = ["type:tags"];
}

export class ParentContactRole {
  role = "string";
  notes = "string";
}

export class Billing {
  iban = "string";
  bic = "string";
  name = "string";
  payment_method:
    | "bank"
    | "cash"
    | "check"
    | "sepa"
    | "paypal"
    | "stripe"
    | "other" = "bank";
}

export const ContactsDefinition: RestTableDefinition = {
  name: "contacts",
  columns: {
    ...columnsFromEntity(Contacts),
    ...new RestEntityColumnsDefinition(),
    favorite: "BOOLEAN",
    is_supplier: "BOOLEAN",
    is_client: "BOOLEAN",
    has_parents: "BOOLEAN",
    parents: "VARCHAR(64)[]",
    parents_roles: "JSONB",
    type: "VARCHAR(64)",
    business_name: "TEXT",
    business_registered_name: "TEXT",
    business_registered_id: "TEXT",
    business_tax_id: "VARCHAR(64)",
    person_first_name: "TEXT",
    person_last_name: "TEXT",
    language: "VARCHAR(64)",
    currency: "VARCHAR(64)",
    invoices: "JSONB",
    preferences: "JSONB",
    email: "VARCHAR(512)",
    phone: "VARCHAR(512)",
    address: "JSONB",
    delivery_address: "JSONB",
    billing: "JSONB",
    notes: "TEXT",
    documents: "VARCHAR(64)[]",
    tags: "VARCHAR(64)[]",

    /*
    [person_first_name, person_last_name, business_name, business_registered_name].filter(Boolean).join(" ")
    */
    full_name: `TEXT GENERATED ALWAYS AS (
  trim(
    coalesce(person_first_name, '') || ' ' ||
    coalesce(person_last_name, '') || ' ' ||
    coalesce(business_name, '') || ' ' ||
    coalesce(business_registered_name, '')
  )
) STORED`,
  },
  pk: ["client_id", "id"],
  indexes: ["USING GIN (searchable_generated)"],
  auditable: true,
  rest: {
    label: (entity: Contacts) =>
      [
        entity.person_first_name,
        entity.person_last_name,
        entity.business_name || entity.business_registered_name,
      ]
        .filter(Boolean)
        .join(" "),
    searchable: (entity: Contacts) => {
      return [
        Object.values(
          flattenKeys(
            _.pick(entity, [
              "person_first_name",
              "person_last_name",
              "business_name",
            ])
          )
        ).join(" "),
        Object.values(
          flattenKeys(
            _.pick(entity, ["email", "phone", "business_registered_name"])
          )
        ).join(" "),
        Object.values(
          flattenKeys(
            _.pick(entity, [
              "business_registered_id",
              "business_tax_id",
              "address",
              "delivery_address",
            ])
          )
        ).join(" "),
      ];
    },
    schema: classToSchema(new Contacts()),
  },
};

export const ContactsSchema = schemaFromEntity<Contacts>(
  ContactsDefinition.columns
);
