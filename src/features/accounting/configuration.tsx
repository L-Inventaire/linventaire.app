import { RestDocumentsInput } from "@components/input-rest";
import { pgcLabel } from "@components/pcg-input";
import { registerCtrlKRestEntity } from "@features/ctrlk";
import { ROUTES } from "@features/routes";
import { formatAmount } from "@features/utils/format/strings";
import { EditorInput } from "@molecules/editor-input";
import { Column } from "@molecules/table/table";
import { AccountingAccountDetailsPage } from "@views/client/modules/accounting/components/accounting-account-details";
import { AccountingTransactionsDetailsPage } from "@views/client/modules/accounting/components/accounting-transactions-details";
import { InvoiceRestDocument } from "@views/client/modules/invoices/components/invoice-lines-input/invoice-input-rest-card";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";
import { useAccountingAccounts } from "./hooks/use-accounting-accounts";
import { AccountingAccounts, AccountingTransactions } from "./types/types";

export const useAccountingTransactionDefaultModel: () => Partial<AccountingTransactions> =
  () => ({});

export const AccountingTransactionsColumns: (
  referenceAccounts?: string[]
) => Column<AccountingTransactions>[] = (referenceAccounts) => [
  {
    title: "Date",
    render: (item) => <>{format(new Date(item.transaction_date), "PP")}</>,
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
          key={item.debit}
          entity="accounting_accounts"
          value={item.debit}
          disabled
          size="md"
        />{" "}
        {" → "}
        <RestDocumentsInput
          key={item.credit}
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
      <AccountingTransactionAmount
        item={item}
        referenceAccounts={referenceAccounts}
      />
    ),
  },
];

const AccountingTransactionAmount = ({
  item,
  referenceAccounts,
}: {
  item: AccountingTransactions;
  referenceAccounts?: string[];
}) => {
  const { accounting_accounts } = useAccountingAccounts({
    query: {
      type: "internal",
    },
  });
  const refs =
    referenceAccounts || accounting_accounts?.data?.list.map((e) => e.id) || [];

  let signedAmount = item.amount;
  if (refs.includes(item.debit)) {
    signedAmount = -item.amount;
  }

  return (
    <div
      className={twMerge(
        refs?.length === 0
          ? "text-black dark:text-white"
          : signedAmount < 0
          ? "text-red-600"
          : "text-green-600"
      )}
    >
      {refs?.length === 0 ? "" : signedAmount < 0 ? "" : "+"}
      {formatAmount(signedAmount, item.currency)}
    </div>
  );
};

registerCtrlKRestEntity<AccountingTransactions>("accounting_transactions", {
  renderEditor: (props) => (
    <AccountingTransactionsDetailsPage readonly={false} id={props.id} />
  ),
  renderResult: AccountingTransactionsColumns(),
  useDefaultData: useAccountingTransactionDefaultModel,
  viewRoute: ROUTES.AccountingView,
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
    <AccountingAccountDetailsPage readonly={false} id={props.id} />
  ),
  renderResult: AccountingAccountsColumns,
  useDefaultData: useAccountingAccountDefaultModel,
});
