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
 * Financial transactions
 * method: cash / bank / check etc
 * external_account: contact + as_supplier or as_client
 * internal_account: null for now, later could be different banks
 */
export default class AccountingTransactions extends RestEntity {
  transaction_date = new Date();

  reference = "string";
  credit = "type:accounting_accounts";
  debit = "type:accounting_accounts";
  amount = 0;
  currency = "string";

  rel_invoices = ["type:invoices"];

  assigned = ["type:users"];
  notes = "string";
  documents = ["type:files"]; // Internal documents linked to the service
  tags = ["type:tags"];
}

export const AccountingTransactionsDefinition: RestTableDefinition = {
  name: "accounting_transactions",
  columns: {
    ...columnsFromEntity(AccountingTransactions),
    ...new RestEntityColumnsDefinition(),
    notes: "TEXT",
  },
  pk: ["client_id", "id"],
  indexes: ["USING GIN (searchable_generated)"],
  auditable: true,
  rest: {
    label: (entity: AccountingTransactions) => entity.reference,
    searchable: (entity: AccountingTransactions) => {
      return Object.values(flattenKeys(_.pick(entity, ["reference"]))).join(
        " "
      );
    },
    schema: classToSchema(new AccountingTransactions()),
  },
};

export const AccountingTransactionsSchema =
  schemaFromEntity<AccountingTransactions>(
    AccountingTransactionsDefinition.columns
  );
