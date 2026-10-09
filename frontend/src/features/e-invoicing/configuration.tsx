import { Base, SectionSmall } from "@atoms/text";
import { CtrlkAction, registerCtrlKRestEntity } from "@features/ctrlk";
import { ROUTES } from "@features/routes";
import { formatAmount } from "@features/utils/format/strings";
import { formatDate } from "@features/utils/format/dates";
import { setDefaultRestActions } from "@features/utils/rest/utils";
import { Column } from "@molecules/table/table";
import { Badge } from "@radix-ui/themes";
import { ReceivedEInvoices } from "./types/types";

export const useReceivedEInvoiceDefaultModel: () => Partial<ReceivedEInvoices> =
  () => {
    return {
      state: "new",
      direction: "in",
      status: "received",
      processed: false,
    };
  };

const getStateLabel = (state: ReceivedEInvoices["state"]) => {
  switch (state) {
    case "new":
      return "Nouveau";
    case "rejected":
      return "Rejeté";
    case "attached":
      return "Rattaché";
    default:
      return state;
  }
};

const getStateColor = (state: ReceivedEInvoices["state"]) => {
  switch (state) {
    case "new":
      return "blue";
    case "rejected":
      return "red";
    case "attached":
      return "green";
    default:
      return "gray";
  }
};

export const ReceivedEInvoicesColumns: Column<ReceivedEInvoices>[] = [
  {
    title: "Date",
    id: "issue_date",
    orderBy: "issue_date",
    render: (item) => (
      <Base className="whitespace-nowrap">
        {formatDate(new Date(item.issue_date))}
      </Base>
    ),
  },
  {
    title: "N° Facture",
    id: "invoice_number",
    orderBy: "invoice_number",
    render: (item) => (
      <SectionSmall className="whitespace-nowrap">
        {item.invoice_number}
      </SectionSmall>
    ),
  },
  {
    title: "Fournisseur",
    id: "seller_name",
    orderBy: "seller_name",
    render: (item) => (
      <div>
        <SectionSmall>{item.seller_name}</SectionSmall>
        {item.seller_vat && (
          <Base className="text-xs text-gray-500">{item.seller_vat}</Base>
        )}
      </div>
    ),
  },
  {
    title: "Montant HT",
    id: "total_amount",
    orderBy: "total_amount",
    thClassName: "w-1",
    cellClassName: "justify-end",
    headClassName: "justify-end",
    render: (item) => (
      <Base className="whitespace-nowrap">
        {formatAmount(item.total_amount, item.currency_code)}
      </Base>
    ),
  },
  {
    title: "TVA",
    id: "total_tax_amount",
    orderBy: "total_tax_amount",
    thClassName: "w-1",
    cellClassName: "justify-end",
    headClassName: "justify-end",
    render: (item) => (
      <Base className="whitespace-nowrap">
        {formatAmount(item.total_tax_amount, item.currency_code)}
      </Base>
    ),
  },
  {
    title: "Montant TTC",
    id: "total_amount_with_tax",
    orderBy: "total_amount_with_tax",
    thClassName: "w-1",
    cellClassName: "justify-end",
    headClassName: "justify-end",
    render: (item) => (
      <SectionSmall className="whitespace-nowrap">
        {formatAmount(item.total_amount_with_tax, item.currency_code)}
      </SectionSmall>
    ),
  },
  {
    title: "État",
    thClassName: "w-1",
    cellClassName: "justify-end",
    headClassName: "justify-end",
    render: (item) => (
      <Badge color={getStateColor(item.state)}>
        {getStateLabel(item.state)}
      </Badge>
    ),
  },
];

registerCtrlKRestEntity<ReceivedEInvoices>("received_e_invoices", {
  renderResult: ReceivedEInvoicesColumns,
  useDefaultData: useReceivedEInvoiceDefaultModel,
  viewRoute: ROUTES.ReceivedEInvoicesView,
  actions: (rows, queryClient) => {
    const actions: CtrlkAction[] = [];
    setDefaultRestActions(actions, "received_e_invoices", rows, queryClient);
    return actions;
  },
});
