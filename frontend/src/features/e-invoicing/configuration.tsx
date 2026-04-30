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

const getStatusLabel = (status: ReceivedEInvoices["status"]) => {
  switch (status) {
    case "received":
      return "Reçue";
    case "validated":
      return "Validée";
    case "error":
      return "Erreur";
    default:
      return status;
  }
};

export const ReceivedEInvoicesColumns: Column<ReceivedEInvoices>[] = [
  {
    title: "Date",
    render: (item) => (
      <Base className="whitespace-nowrap">
        {formatDate(new Date(item.issue_date))}
      </Base>
    ),
  },
  {
    title: "N° Facture",
    render: (item) => (
      <SectionSmall className="whitespace-nowrap">
        {item.invoice_number}
      </SectionSmall>
    ),
  },
  {
    title: "Fournisseur",
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
