import { useCurrentClient } from "@features/clients/state/use-clients";
import { registerCtrlKRestEntity } from "@features/ctrlk";
import { ROUTES } from "@features/routes";
import { InvoicesDetailsPage } from "@views/client/modules/invoices/components/invoices-details";
import { Invoices } from "./types/types";
import { Base, BaseSmall, Info } from "@atoms/text";
import { RestDocumentsInput } from "@components/input-rest";
import { TagsInput } from "@components/input-rest/tags";
import { formatTime } from "@features/utils/format/dates";
import { formatAmount } from "@features/utils/format/strings";
import { InvoiceStatus } from "@views/client/modules/invoices/components/invoice-status";
import { Column } from "@molecules/table/table";
import {
  isComplete,
  isDeliveryLate,
  isPaymentLate,
} from "@views/client/modules/invoices/utils";
import { Tag } from "@atoms/badge/tag";
import { twMerge } from "tailwind-merge";
import { InputOutlinedDefaultBorders } from "@atoms/styles/inputs";
import { TagPaymentCompletion } from "@views/client/modules/invoices/components/tag-payment-completion";
import { UsersInput } from "@components/input-rest/users";

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
          {invoice.subscription?.enabled && <span>(Abonnement)</span>}
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
      <Base className="whitespace-nowrap space-x-2">
        <TagsInput size="md" value={invoice.tags} disabled />
        <UsersInput size="md" value={invoice.assigned} disabled />
        {["quotes"].includes(invoice.type) &&
          invoice.state !== "closed" &&
          isComplete(invoice) && (
            <Tag
              className={twMerge(InputOutlinedDefaultBorders + " rounded-full")}
              color={"green"}
            >
              À facturer
            </Tag>
          )}
        {["quotes"].includes(invoice.type) &&
          invoice.wait_for_completion_since &&
          invoice.state !== "closed" &&
          !isComplete(invoice) &&
          invoice.state === "purchase_order" &&
          isDeliveryLate(invoice) && (
            <Tag
              className={twMerge(InputOutlinedDefaultBorders + " rounded-full")}
              color={"red"}
            >
              Livraison en retard
            </Tag>
          )}
        {["invoices", "supplier_invoices"].includes(invoice.type) &&
          invoice.wait_for_completion_since &&
          invoice.state === "purchase_order" &&
          isPaymentLate(invoice) && (
            <Tag
              className={twMerge(InputOutlinedDefaultBorders + " rounded-full")}
              color={"red"}
            >
              Paiement en retard
            </Tag>
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
});
