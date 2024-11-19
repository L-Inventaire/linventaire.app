import { Base, BaseSmall, Info } from "@atoms/text";
import { RestDocumentsInput } from "@components/input-rest";
import { TagsInput } from "@components/input-rest/tags";
import { UsersInput } from "@components/input-rest/users";
import { useCurrentClient } from "@features/clients/state/use-clients";
import { registerCtrlKRestEntity } from "@features/ctrlk";
import { ROUTES } from "@features/routes";
import { formatTime } from "@features/utils/format/dates";
import { formatAmount } from "@features/utils/format/strings";
import { Column } from "@molecules/table/table";
import { Badge } from "@radix-ui/themes";
import { CompletionTags } from "@views/client/modules/invoices/components/invoice-lines-input/components/completion-tags";
import { InvoiceStatus } from "@views/client/modules/invoices/components/invoice-status";
import { InvoicesDetailsPage } from "@views/client/modules/invoices/components/invoices-details";
import { TagPaymentCompletion } from "@views/client/modules/invoices/components/tag-payment-completion";
import {
  isDeliveryLate,
  isPaymentLate,
} from "@views/client/modules/invoices/utils";
import _ from "lodash";
import { Invoices } from "./types/types";

export const useInvoiceDefaultModel: () => Partial<Invoices> = () => {
  const { client } = useCurrentClient();

  return {
    type: "quotes",
    state: "draft",
    language: client!.preferences?.language || "fr",
    currency: client!.preferences?.currency || "EUR",
    format: client!.invoices,
    payment_information: client!.payment,
  };
};

export const InvoicesColumns: Column<Invoices>[] = [
  {
    title: "Date",
    thClassName: "w-16",
    render: (invoice) => {
      return (
        <Base className="whitespace-nowrap">
          {invoice.emit_date
            ? formatTime(invoice.emit_date, { hideTime: true })
            : "-"}
        </Base>
      );
    },
  },
  {
    title: "Libellé",
    render: (invoice) => (
      <Base className="opacity-50 whitespace-nowrap">
        <BaseSmall>
          {invoice.reference}{" "}
          {invoice.content?.some((a) => a.subscription) && (
            <span>(Abonnement)</span>
          )}
        </BaseSmall>
        <br />
        <div className="flext items-center jhustify-center">
          <span>{invoice.name || "-"} </span>
        </div>
      </Base>
    ),
  },
  {
    title: "Client",
    render: (invoice) => (
      <Base className="whitespace-nowrap">
        <RestDocumentsInput
          disabled
          value={invoice.client}
          entity={"contacts"}
        />
      </Base>
    ),
  },
  {
    title: "Étiquettes",
    thClassName: "w-1",
    cellClassName: "justify-end",
    headClassName: "justify-end",
    render: (invoice) => (
      <Base className="whitespace-nowrap space-x-2 flex flex-row items-center">
        <TagsInput size="md" value={invoice.tags} disabled />
        <UsersInput size="md" value={invoice.assigned} disabled />
        {["quotes"].includes(invoice.type) &&
          invoice.state === "purchase_order" &&
          isDeliveryLate(invoice) && (
            <Badge size="2" color={"red"}>
              Livraison en retard
            </Badge>
          )}
        {["invoices", "supplier_invoices"].includes(invoice.type) &&
          invoice.wait_for_completion_since &&
          invoice.state === "purchase_order" &&
          isPaymentLate(invoice) && (
            <Badge size="2" color={"red"}>
              Paiement en retard
            </Badge>
          )}
        {(invoice.type === "quotes" || invoice.type === "supplier_quotes") && (
          <CompletionTags invoice={invoice} size="sm" lines={invoice.content} />
        )}
        {invoice.type === "invoices" && (
          <TagPaymentCompletion invoice={invoice} />
        )}
      </Base>
    ),
  },
  {
    title: "Montant",
    thClassName: "w-1",
    cellClassName: "justify-end",
    headClassName: "justify-end",
    render: (invoice) => (
      <Base className="text-right whitespace-nowrap">
        {formatAmount(invoice.total?.total_with_taxes || 0)}
        <br />
        <Info>{formatAmount(invoice.total?.total || 0)} HT</Info>
      </Base>
    ),
  },
  {
    title: "Statut",
    thClassName: "w-1",
    cellClassName: "justify-end",
    headClassName: "justify-end",
    render: (invoice) => (
      <InvoiceStatus
        size="sm"
        readonly
        value={invoice.state}
        type={invoice.type}
      />
    ),
  },
];

export const SupplierQuotesColumns: Column<Invoices>[] = [
  InvoicesColumns[0],
  InvoicesColumns[1],
  InvoicesColumns[2],
  InvoicesColumns[3],
  {
    title: "Fournisseur",
    render: (invoice) => (
      <Base className="whitespace-nowrap">
        <RestDocumentsInput
          disabled
          value={invoice.supplier}
          entity={"contacts"}
        />
      </Base>
    ),
  },
  {
    title: "Articles",
    render: (invoice) => (
      <Base className="whitespace-nowrap">
        {_.slice(invoice.articles.all ?? [], 0, 3).map((article) => (
          <RestDocumentsInput disabled value={article} entity={"articles"} />
        ))}
      </Base>
    ),
  },
  InvoicesColumns[4],
  InvoicesColumns[5],
];

registerCtrlKRestEntity<Invoices>("invoices", {
  renderEditor: (props) => (
    <InvoicesDetailsPage readonly={false} id={props.id} />
  ),
  renderResult: InvoicesColumns,
  useDefaultData: useInvoiceDefaultModel,
  viewRoute: ROUTES.InvoicesView,
  orderBy: "state,emit_date",
  orderDesc: true,
  groupBy: "state",
  groupByRender: (row) => (
    <div className="mt-px">
      <InvoiceStatus size="xs" readonly value={row.state} type={row.type} />
    </div>
  ),
});
