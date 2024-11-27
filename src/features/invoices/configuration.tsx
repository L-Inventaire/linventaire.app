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
import { InvoiceRestDocument } from "@views/client/modules/invoices/components/invoice-lines-input/invoice-input-rest-card";
import { ContactRestDocument } from "@views/client/modules/contacts/components/contact-input-rest-card";

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
    title: "Référence",
    render: (invoice) => (
      <Base className="whitespace-nowrap max-w-xs overflow-hidden text-ellipsis">
        <BaseSmall>
          {invoice.reference}{" "}
          {invoice.content?.some((a) => a.subscription) && (
            <span>(Abonnement)</span>
          )}
        </BaseSmall>
        <br />
        <div className="opacity-50 text-ellipsis overflow-hidden w-full">
          {invoice.name || invoice.content?.map((a) => a.name).join(", ")}{" "}
        </div>
      </Base>
    ),
  },
  {
    title: "Origine",
    id: "origin",
    render: (invoice) => (
      <Base className="whitespace-nowrap">
        <InvoiceRestDocument
          className="overflow-hidden"
          disabled
          value={invoice.from_rel_quote || invoice.from_rel_invoice}
        />
      </Base>
    ),
  },
  {
    title: "Client",
    id: "client",
    render: (invoice) => (
      <Base className="whitespace-nowrap">
        <ContactRestDocument disabled value={invoice.client} />
      </Base>
    ),
  },
  {
    title: "Fournisseur",
    id: "supplier",
    render: (invoice) => (
      <Base className="whitespace-nowrap">
        <ContactRestDocument disabled value={invoice.supplier} />
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

registerCtrlKRestEntity<Invoices>("invoices", {
  renderEditor: (props) => (
    <InvoicesDetailsPage readonly={false} id={props.id} />
  ),
  renderResult: InvoicesColumns,
  useDefaultData: useInvoiceDefaultModel,
  viewRoute: ROUTES.InvoicesView,
  orderBy: "state_order,emit_date",
  orderDesc: true,
  groupBy: "state",
  groupByRender: (row) => (
    <div className="mt-px">
      <InvoiceStatus size="xs" readonly value={row.state} type={row.type} />
    </div>
  ),
});
