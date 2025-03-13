import { Tag } from "@atoms/badge/tag";
import { Base, BaseSmall, Info } from "@atoms/text";
import { TagsInput } from "@components/input-rest/tags";
import { UsersInput } from "@components/input-rest/users";
import { withModel } from "@components/search-bar/utils/as-model";
import { useCurrentClient } from "@features/clients/state/use-clients";
import {
  ContextId,
  CtrlkAction,
  registerCtrlKRestEntity,
} from "@features/ctrlk";
import { getRoute, ROUTES } from "@features/routes";
import { formatAmount } from "@features/utils/format/strings";
import { RestFieldsNames } from "@features/utils/rest/configuration";
import { getRestApiClient } from "@features/utils/rest/hooks/use-rest";
import {
  ArchiveBoxArrowDownIcon,
  ArrowPathIcon,
  CheckIcon,
  RectangleStackIcon,
  TrashIcon,
} from "@heroicons/react/16/solid";
import { Column } from "@molecules/table/table";
import { Badge } from "@radix-ui/themes";
import { frequencyOptions } from "@views/client/modules/articles/components/article-details";
import { ContactRestDocument } from "@views/client/modules/contacts/components/contact-input-rest-card";
import { CompletionTags } from "@views/client/modules/invoices/components/invoice-lines-input/components/completion-tags";
import { InvoiceRestDocument } from "@views/client/modules/invoices/components/invoice-lines-input/invoice-input-rest-card";
import { InvoiceStatus } from "@views/client/modules/invoices/components/invoice-status";
import { InvoicesDetailsPage } from "@views/client/modules/invoices/components/invoices-details";
import { TagPaymentCompletion } from "@views/client/modules/invoices/components/tag-payment-completion";
import { InvoicesEditPage } from "@views/client/modules/invoices/edit";
import {
  computePricesFromInvoice,
  isDeliveryLate,
  isPaymentLate,
} from "@views/client/modules/invoices/utils";
import { InvoicesViewPage } from "@views/client/modules/invoices/view";
import { format } from "date-fns";
import _ from "lodash";
import toast from "react-hot-toast";
import { InvoicesApiClient } from "./api-client/invoices-api-client";
import { Invoices } from "./types/types";

export const useInvoiceDefaultModel: () => Partial<Invoices> = () => {
  const { client } = useCurrentClient();

  return {
    type: "quotes",
    state: "draft",
    language: client!.preferences?.language || "fr",
    currency: client!.preferences?.currency || "EUR",
    format: {} as any,
    payment_information: client!.payment,
    subscription: client!.recurring,
  };
};

export const InvoicesColumns: Column<Invoices>[] = [
  {
    title: "Émis le",
    id: "emit_date",
    thClassName: "w-16",
    orderBy: "emit_date",
    render: (invoice) => {
      return (
        <Base className="whitespace-nowrap">
          {invoice.emit_date
            ? // Short format for today
              format(invoice.emit_date, "PP")
            : "-"}
        </Base>
      );
    },
  },
  {
    title: "Référence",
    id: "reference",
    orderBy: "reference",
    render: (invoice) => (
      <Base className="whitespace-nowrap max-w-xs overflow-hidden text-ellipsis">
        <BaseSmall>
          {invoice.reference}{" "}
          {(invoice.type === "credit_notes" ||
            invoice.type === "supplier_credit_notes") && (
            <span className="opacity-50"> • Avoir</span>
          )}
          {!!invoice.from_subscription?.from && (
            <span className="opacity-50">
              {" "}
              • Du {format(
                invoice.from_subscription.from,
                "yyyy-MM-dd"
              )} au {format(invoice.from_subscription.to, "yyyy-MM-dd")}
            </span>
          )}
        </BaseSmall>
        <br />
        <div className="opacity-50 text-ellipsis overflow-hidden w-full">
          {[invoice.name, invoice.content?.map((a) => a.name).join(", ")]
            .filter(Boolean)
            .join(" • ")}
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
          value={
            (invoice.from_rel_quote?.length ? invoice.from_rel_quote : null) ||
            invoice.from_rel_invoice
          }
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

        {(invoice.type === "quotes" || invoice.type === "supplier_quotes") && (
          <CompletionTags invoice={invoice} size="sm" lines={invoice.content} />
        )}
        {["quotes"].includes(invoice.type) &&
          invoice.state === "purchase_order" &&
          isDeliveryLate(invoice) && (
            <Badge size="2" color={"red"}>
              Livraison en retard
            </Badge>
          )}

        {invoice.type === "invoices" && (
          <TagPaymentCompletion invoice={invoice} />
        )}
        {["invoices", "supplier_invoices"].includes(invoice.type) &&
          invoice.wait_for_completion_since &&
          invoice.state === "purchase_order" &&
          isPaymentLate(invoice) && (
            <Badge size="2" color={"red"}>
              Paiement en retard
            </Badge>
          )}
      </Base>
    ),
  },
  {
    title: "Montant",
    thClassName: "w-1",
    cellClassName: "justify-end",
    headClassName: "justify-end",
    orderBy: "(total->>'total')::numeric",
    render: (invoice) => {
      const isCreditNote =
        invoice.type === "credit_notes" ||
        invoice.type === "supplier_credit_notes";
      return invoice.content?.some((a) => a.subscription) &&
        invoice.type === "quotes" ? (
        <Base className="text-right whitespace-nowrap space-y-1 my-2">
          {Object.entries(
            _.groupBy(
              invoice.content?.filter((a) => (a.unit_price || 0) >= 0),
              "subscription"
            )
          ).map(([key, value]) => {
            const computed = computePricesFromInvoice({
              content: value,
              discount:
                invoice.discount?.mode === "percentage"
                  ? invoice.discount
                  : { mode: "percentage", value: 0 },
            });
            return (
              <div>
                <Tag
                  color="blue"
                  size={"xs"}
                  icon={
                    !!key ? (
                      <ArrowPathIcon
                        className={`w-3 h-3 mr-1 shrink-0 text-blue-500`}
                      />
                    ) : undefined
                  }
                >
                  {formatAmount(computed?.total_with_taxes || 0)}{" "}
                  <Info>({formatAmount(computed?.total || 0)} HT)</Info>{" "}
                  {frequencyOptions.find((a) => a.value === key)?.per_label ||
                    key}
                </Tag>
              </div>
            );
          })}
        </Base>
      ) : (
        <Base className="text-right whitespace-nowrap">
          {isCreditNote && <span className="opacity-50">Avoir de </span>}
          {formatAmount(invoice.total?.total_with_taxes || 0)}
          <br />
          <Info>{formatAmount(invoice.total?.total || 0)} HT</Info>
        </Base>
      );
    },
  },
  {
    title: "Statut",
    id: "state",
    thClassName: "w-1",
    cellClassName: "justify-end",
    headClassName: "justify-end",
    orderBy: "state_order",
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
    <InvoicesDetailsPage readonly={props.readonly || false} id={props.id} />
  ),
  renderPage: (props) => (
    <ContextId.Provider value={props.id}>
      {props.readonly ? <InvoicesViewPage /> : <InvoicesEditPage />}
    </ContextId.Provider>
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
  actions: (rows, queryClient) => {
    const actions: CtrlkAction[] = [];
    if (
      (rows.every((a) => a.type === "quotes") &&
        _.uniqBy(rows, "client").length === 1) ||
      (rows.every((a) => a.type === "supplier_quotes") &&
        _.uniqBy(rows, "supplier").length === 1)
    ) {
      actions.push({
        label: rows.length === 1 ? "Facturer" : "Créer une facture groupée",
        icon: (p) => <RectangleStackIcon {...p} />,
        action: async () => {
          const invoice: Partial<Invoices> = {
            ...rows[0],
            id: "",
            type: rows.every((a) => a.type === "quotes")
              ? "invoices"
              : "supplier_invoices",
            state: "draft",
            name: rows.map((a) => a.reference).join(", "),
            client_id: rows[0].client_id,
            content: [],
            from_rel_quote: rows.map((a) => a.id),
            emit_date: Date.now(),
            discount: {
              mode: "amount",
              value: 0,
            },
            client: rows[0].client,
            contact: rows[0].contact,
            supplier: rows[0].supplier,
          };
          for (const row of rows) {
            const partial = await InvoicesApiClient.getPartialInvoice(row);
            invoice.content?.push(...(partial.partial_invoice.content || []));
            invoice.discount!.value +=
              partial.partial_invoice.discount?.value || 0;
          }
          document.location = withModel<Invoices>(
            getRoute(ROUTES.InvoicesEdit, {
              id: "new",
            }),
            invoice
          );
        },
      } as CtrlkAction);
    }

    if (rows.every((a) => a.state === "sent" && a.type === "quotes")) {
      actions.push({
        label: "Marquer comme accepté",
        icon: (p) => <CheckIcon {...p} />,
        action: async () => {
          const table = "invoices";
          const rest = getRestApiClient(table);
          for (const row of rows) {
            try {
              await rest.update(row.client_id, {
                id: row.id,
                state: "purchase_order",
              });
            } catch (e) {
              toast.error("Erreur lors de la mise à jour de la facture");
            }
          }
          queryClient.invalidateQueries({ queryKey: [table] });
        },
      } as CtrlkAction);
    }

    if (rows.every((a) => !a.is_deleted)) {
      actions.push({
        label: "Supprimer",
        icon: (p) => <TrashIcon {...p} />,
        action: async () => {
          const table = "invoices";
          const rest = getRestApiClient(table);
          for (const row of rows) {
            try {
              await rest.delete(row.client_id, row.id);
            } catch (e) {
              toast.error("Erreur lors de la mise à jour de la facture");
            }
          }
          queryClient.invalidateQueries({ queryKey: [table] });
        },
      } as CtrlkAction);
    }

    if (rows.every((a) => a.is_deleted)) {
      actions.push({
        label: "Restaurer",
        icon: (p) => <ArchiveBoxArrowDownIcon {...p} />,
        action: async () => {
          const table = "invoices";
          const rest = getRestApiClient(table);
          for (const row of rows) {
            try {
              await rest.restore(row.client_id, row.id);
            } catch (e) {
              toast.error("Erreur lors de la mise à jour de la facture");
            }
          }
          queryClient.invalidateQueries({ queryKey: [table] });
        },
      } as CtrlkAction);
    }

    return [...actions];
  },
});

export const InvoicesFieldsNames = () => ({
  type: {
    label: "Type",
    keywords: "type devis avoirs",
  },
  state: {
    label: "Statut",
    keywords: "factures brouillon envoyé terminé état statut status",
  },
  emit_date: {
    label: "Date d'émission",
    keywords: "date émission creation",
  },
  "recipients[0].role": false,
  "recipients[0].email": false,
  "reminders.enabled": false,
  reminder: false,
  "reminders.repetition": false,
  reference: {
    label: "Référence",
    keywords: "référence numéro",
  },
  alt_reference: {
    label: "Référence alternative",
    keywords: "référence alternative numéro",
  },
  from_rel_quote: {
    label: "Devis d'origine",
    keywords: "devis origine",
  },
  from_rel_invoice: {
    label: "Facture d'origine",
    keywords: "facture origine",
  },
  "from_subscription.to": {
    label: "Date de fin de l'abonnement",
    keywords: "abonnement date fin",
  },
  "from_subscription.from": {
    label: "Date de début de l'abonnement",
    keywords: "abonnement date début",
  },
  "total.total": {
    label: "Total HT",
    keywords: "total ht",
  },
  "total.total_with_taxes": {
    label: "Total TTC",
    keywords: "total ttc",
  },
  client: {
    label: "Client",
    keywords: "client",
  },
  supplier: {
    label: "Fournisseur",
    keywords: "fournisseur",
  },
  contact: {
    label: "Contact",
    keywords: "contact",
  },
  "articles.computed_tags": {
    label: "Étiquettes des articles",
    keywords: "étiquettes articles",
  },
  "articles.all": {
    label: "Articles",
    keywords: "articles lignes produits",
  },
  "payment_information.computed_date": {
    label: "Date de paiement",
    keywords: "date paiement",
  },
  "total.taxes": false,
  "total.discount": false,
  "total.initial": false,
  documents: false,
  ...RestFieldsNames(),
});
