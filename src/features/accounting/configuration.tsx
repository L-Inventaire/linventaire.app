import { RestDocumentsInput } from "@components/input-rest";
import { pgcLabel } from "@components/pcg-input";
import { registerCtrlKRestEntity } from "@features/ctrlk";
import { ROUTES } from "@features/routes";
import { formatTime } from "@features/utils/format/dates";
import { formatAmount } from "@features/utils/format/strings";
import { EditorInput } from "@molecules/editor-input";
import { Column } from "@molecules/table/table";
import { AccountingAccountsDetailsPage } from "@views/client/modules/accounting/components/accounting-accounts-details";
import { AccountingTransactionsDetailsPage } from "@views/client/modules/accounting/components/accounting-transactions-details";
import { InvoiceRestDocument } from "@views/client/modules/invoices/components/invoice-lines-input/invoice-input-rest-card";
import { twMerge } from "tailwind-merge";
import { AccountingAccounts, AccountingTransactions } from "./types/types";

export const useAccountingTransactionDefaultModel: () => Partial<AccountingTransactions> =
  () => ({});

export const AccountingTransactionsColumns: Column<AccountingTransactions>[] = [
  {
    title: "Date",
    render: (item) => (
      <>
        {formatTime(item.transaction_date, {
          hideTime: true,
          keepDate: true,
        })}
      </>
    ),
  },
  { title: "Référence", render: (item) => <>{item.reference}</> },
  {
    title: "Documents",
    render: (item) => (
      <InvoiceRestDocument value={item.rel_invoices} disabled size="md" />
    ),
  },
  {
    title: "Comptes",
    render: (item) => (
      <div>
        <RestDocumentsInput
          entity="accounting_accounts"
          value={item.debit}
          disabled
          size="md"
        />{" "}
        {"-> "}
        <RestDocumentsInput
          entity="accounting_accounts"
          value={item.credit}
          disabled
          size="md"
        />
      </div>
    ),
  },
  {
    title: "Montant",
    headClassName: "justify-end",
    cellClassName: "justify-end",
    render: (item) => (
      <div
        className={twMerge(item.amount < 0 ? "text-red-600" : "text-green-600")}
      >
        {item.amount < 0 ? "" : "+"}
        {formatAmount(item.amount, item.currency)}
      </div>
    ),
  },
];

registerCtrlKRestEntity<AccountingTransactions>("accounting_transactions", {
  renderEditor: (props) => (
    <AccountingTransactionsDetailsPage readonly={false} id={props.id} />
  ),
  renderResult: AccountingTransactionsColumns,
  useDefaultData: useAccountingTransactionDefaultModel,
  viewRoute: ROUTES.StockView,
});

export const useAccountingAccountDefaultModel: () => Partial<AccountingAccounts> =
  () => ({});

export const AccountingAccountsColumns: Column<AccountingAccounts>[] = [
  {
    thClassName: "w-1 pr-4",
    className: "whitespace-nowrap",
    title: "Type",
    render: (stockLocation) => (
      <>{pgcLabel(stockLocation.standard_identifier)}</>
    ),
  },
  {
    thClassName: "w-1 pr-4",
    title: "Nom",
    render: (stockLocation) => <>{stockLocation.name}</>,
  },
  {
    title: "Notes",
    render: (stockLocation) => (
      <EditorInput value={stockLocation.notes} disabled placeholder="-" />
    ),
  },
];

registerCtrlKRestEntity<AccountingAccounts>("accounting_accounts", {
  renderEditor: (props) => (
    <AccountingAccountsDetailsPage readonly={false} id={props.id} />
  ),
  renderResult: AccountingAccountsColumns,
  useDefaultData: useAccountingAccountDefaultModel,
  viewRoute: ROUTES.StockView,
});
