import { registerCtrlKRestEntity } from "@features/ctrlk";
import { ROUTES } from "@features/routes";
import { AccountingTransactionsDetailsPage } from "@views/client/modules/accounting/components/accounting-transactions-details";
import { AccountingAccountsDetailsPage } from "@views/client/modules/accounting/components/accounting-accounts-details";
import { AccountingTransactions, AccountingAccounts } from "./types/types";
import { Tag } from "@atoms/badge/tag";
import { RestDocumentsInput } from "@components/input-rest";
import { formatAmount } from "@features/utils/format/strings";
import { twMerge } from "tailwind-merge";
import { formatTime } from "@features/utils/format/dates";
import { InvoiceRestDocument } from "@views/client/modules/invoices/components/invoice-lines-input/invoice-input-rest-card";

export const useAccountingTransactionDefaultModel: () => Partial<AccountingTransactions> =
  () => ({});

registerCtrlKRestEntity<AccountingTransactions>("accounting_transactions", {
  renderEditor: (props) => (
    <AccountingTransactionsDetailsPage readonly={false} id={props.id} />
  ),
  renderResult: [
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
          className={twMerge(
            item.amount < 0 ? "text-red-600" : "text-green-600"
          )}
        >
          {item.amount < 0 ? "" : "+"}
          {formatAmount(item.amount, item.currency)}
        </div>
      ),
    },
  ],
  useDefaultData: useAccountingTransactionDefaultModel,
  viewRoute: ROUTES.StockView,
});

export const useAccountingAccountDefaultModel: () => Partial<AccountingAccounts> =
  () => ({});

registerCtrlKRestEntity<AccountingAccounts>("accounting_accounts", {
  renderEditor: (props) => (
    <AccountingAccountsDetailsPage readonly={false} id={props.id} />
  ),
  renderResult: [
    {
      title: "Identifiant",
      render: (item) => <Tag>{item.standard_identifier}</Tag>,
    },
    { title: "Nom", render: (item) => <>{item.name}</> },
    {
      title: "Contact",
      render: (item) => (
        <>
          <RestDocumentsInput
            value={item.contact as any}
            entity="contacts"
            disabled
            size="md"
          />
        </>
      ),
    },
    { title: "Notes", render: (item) => <>{item.notes}</> },
  ],
  useDefaultData: useAccountingAccountDefaultModel,
  viewRoute: ROUTES.StockView,
});
