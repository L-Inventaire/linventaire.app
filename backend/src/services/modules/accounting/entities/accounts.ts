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

/**
 * account for the clients / ourselves / suppliers / etc
 */
export default class AccountingAccounts extends RestEntity {
  type: "client" | "supplier" | "internal" = "client";
  contact = "type:contacts";
  standard_identifier = "string"; // Numéro sur le plan comptable
  standard: "pcg" | "ifrs" = "pcg"; // Plan Comptable Général, dans le futur pourrait être étendu à d'autres standards
  name = "string";
  notes = "string";
}

export const AccountingAccountsDefinition: RestTableDefinition = {
  name: "accounting_accounts",
  columns: {
    ...columnsFromEntity(AccountingAccounts),
    ...new RestEntityColumnsDefinition(),
  },
  pk: ["client_id", "id"],
  indexes: ["USING GIN (searchable_generated)"],
  auditable: true,
  rest: {
    label: (entity: AccountingAccounts) => entity.name,
    searchable: (entity: AccountingAccounts) => {
      return Object.values(flattenKeys(_.pick(entity, ["name"]))).join(" ");
    },
    schema: classToSchema(new AccountingAccounts()),
  },
};

export const AccountsSchema = schemaFromEntity<AccountingAccounts>(
  AccountingAccountsDefinition.columns
);
