import { RestOptions, useRest } from "@features/utils/rest/hooks/use-rest";
import { AccountingTransactions } from "../types/types";
import { useEffect } from "react";

export const useAccountingTransactions = (
  options?: RestOptions<AccountingTransactions>
) => {
  const rest = useRest<AccountingTransactions>(
    "accounting_transactions",
    options
  );

  useEffect(() => {
    rest.refresh();
  }, [JSON.stringify(options)]);

  return { accounting_transactions: rest.items, ...rest };
};

export const useAccountingTransaction = (id: string) => {
  const rest = useAccountingTransactions({ query: { id } });
  return {
    accounting_transaction: id
      ? (rest.accounting_transactions.data?.list || [])[0]
      : null,
    isPending: id ? rest.accounting_transactions.isPending : false,
    ...rest,
  };
};
