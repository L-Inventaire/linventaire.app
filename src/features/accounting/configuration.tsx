import { registerCtrlKRestEntity } from "@features/ctrlk";
import { ROUTES } from "@features/routes";
import { AccountingTransactionsDetailsPage } from "@views/client/modules/accounting/components/accounting-transactions-details";
import { AccountingAccountsDetailsPage } from "@views/client/modules/accounting/components/accounting-accounts-details";
import { AccountingTransactions, AccountingAccounts } from "./types/types";

export const useAccountingTransactionDefaultModel: () => Partial<AccountingTransactions> =
  () => ({});

registerCtrlKRestEntity<AccountingTransactions>("accounting_transactions", {
  renderEditor: (props) => (
    <AccountingTransactionsDetailsPage readonly={false} id={props.id} />
  ),
  renderResult: (item) => <>{item.reference}</>,
  useDefaultData: useAccountingTransactionDefaultModel,
  viewRoute: ROUTES.StockView,
});

export const useAccountingAccountDefaultModel: () => Partial<AccountingAccounts> =
  () => ({});

registerCtrlKRestEntity<AccountingAccounts>("accounting_accounts", {
  renderEditor: (props) => (
    <AccountingAccountsDetailsPage readonly={false} id={props.id} />
  ),
  renderResult: (item) => <>{item.name}</>,
  useDefaultData: useAccountingAccountDefaultModel,
  viewRoute: ROUTES.StockView,
});
