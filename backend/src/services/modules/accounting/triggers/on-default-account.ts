import Framework from "../../../../platform";
import AccountingAccounts, {
  AccountingAccountsDefinition,
} from "../entities/accounts";

/**
 * Only one default internal account (bank or cash) per company: the one
 * preselected when a payment is recorded. Setting one unsets the others.
 */
export const setOnDefaultAccountTrigger = () =>
  Framework.TriggersManager.registerTrigger<AccountingAccounts>(
    AccountingAccountsDefinition,
    {
      name: "accounting-accounts-single-default",
      test: (_ctx, entity, old) =>
        entity?.type === "internal" && !!entity?.is_default && !old?.is_default,
      callback: async (ctx, entity) => {
        const db = await Framework.Db.getService();
        const others = await db.select<AccountingAccounts>(
          ctx,
          AccountingAccountsDefinition.name,
          { client_id: entity.client_id, type: "internal", is_default: true }
        );
        for (const other of others.filter((a) => a.id !== entity.id)) {
          await db.update<AccountingAccounts>(
            ctx,
            AccountingAccountsDefinition.name,
            { client_id: entity.client_id, id: other.id },
            { is_default: false }
          );
        }
      },
    }
  );
