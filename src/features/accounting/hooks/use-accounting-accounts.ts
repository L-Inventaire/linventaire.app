import { RestOptions, useRest } from "@features/utils/rest/hooks/use-rest";
import { AccountingAccounts } from "../types/types";
import { useEffect } from "react";

export const useAccountingAccounts = (
  options?: RestOptions<AccountingAccounts>
) => {
  const rest = useRest<AccountingAccounts>("accounting_transactions", options);

  useEffect(() => {
    rest.refresh();
  }, [JSON.stringify(options)]);

  return { accounting_transactions: rest.items, ...rest };
};

export const useAccountingAccount = (id: string) => {
  const rest = useAccountingAccounts({ query: { id } });
  return {
    accounting_transaction: id
      ? (rest.accounting_transactions.data?.list || [])[0]
      : null,
    isPending: id ? rest.accounting_transactions.isPending : false,
    ...rest,
  };
};
