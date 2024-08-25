import { RestOptions, useRest } from "@features/utils/rest/hooks/use-rest";
import { AccountingAccounts } from "../types/types";
import { useEffect } from "react";

export const useAccountingAccounts = (
  options?: RestOptions<AccountingAccounts>
) => {
  const rest = useRest<AccountingAccounts>("accounting_accounts", options);

  useEffect(() => {
    rest.refresh();
  }, [JSON.stringify(options)]);

  return { accounting_accounts: rest.items, ...rest };
};

export const useAccountingAccount = (id: string) => {
  const rest = useAccountingAccounts({ query: { id } });
  return {
    accounting_transaction: id
      ? (rest.accounting_accounts.data?.list || [])[0]
      : null,
    isPending: id ? rest.accounting_accounts.isPending : false,
    ...rest,
  };
};
