import { generateQueryFromMap } from "@components/search-bar/utils/utils";
import { useAccountingTransactions } from "@features/accounting/hooks/use-accounting-transactions";
import { AccountingTransactions } from "@features/accounting/types/types";
import { Invoices } from "@features/invoices/types/types";

const computePaymentCompletion = (
  invoice: Invoices,
  linesu: AccountingTransactions[]
) => {
  const lines = linesu || [];

  if (!invoice.total?.total_with_taxes) return 0;

  return (
    lines.reduce((acc, line) => acc + line.amount, 0) /
    invoice.total?.total_with_taxes
  );
};

const renderPaymentCompletion = (
  invoice: Invoices,
  linesu: AccountingTransactions[]
): [number, string] => {
  const value = computePaymentCompletion(invoice, linesu);
  const color = value < 0.5 ? "red" : value < 1 ? "orange" : "green";
  return [Math.round(value * 100), color];
};

export const usePaymentCompletion = (invoice: Invoices) => {
  const { items: accountingTransactions } = useAccountingTransactions({
    query: generateQueryFromMap({ rel_invoices: [invoice.id] }),
  });

  const paymentCompletion = renderPaymentCompletion(
    invoice,
    accountingTransactions?.data?.list ?? []
  );

  return { value: paymentCompletion[0], color: paymentCompletion[1] };
};
