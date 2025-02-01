import { Unit } from "@atoms/input/input-unit";
import { Base, SectionSmall } from "@atoms/text";
import { RestDocumentsInput } from "@components/input-rest";
import { TagsInput } from "@components/input-rest/tags";
import { UsersInput } from "@components/input-rest/users";
import { Articles } from "@features/articles/types/types";
import { getContactName } from "@features/contacts/types/types";
import { registerCtrlKRestEntity } from "@features/ctrlk";
import { getRoute, ROUTES } from "@features/routes";
import { formatQuantity } from "@features/utils/format/strings";
import { DocumentCheckIcon, UserIcon } from "@heroicons/react/16/solid";
import { Column } from "@molecules/table/table";
import { Badge } from "@radix-ui/themes";
import { getArticleIcon } from "@views/client/modules/articles/components/article-icon";
import { InvoiceRestDocument } from "@views/client/modules/invoices/components/invoice-lines-input/invoice-input-rest-card";
import { ServiceItemStatus } from "@views/client/modules/service/components/service-item-status";
import { ServiceItemsDetailsPage } from "@views/client/modules/service/components/service-items-details";
import { ServiceTimesDetailsPage } from "@views/client/modules/service/components/service-times-details";
import { format } from "date-fns";
import _ from "lodash";
import { twMerge } from "tailwind-merge";
import { ServiceItems, ServiceTimes } from "./types/types";

export const useServiceItemDefaultModel: () => Partial<ServiceItems> = () => {
  return {
    started_at: Date.now(),
    state: "todo",
  };
};

export const ServiceItemsColumns: Column<ServiceItems>[] = [
  {
    title: "Date",
    render: (item) => (
      <Base className="whitespace-nowrap">
        {format(new Date(item.started_at || item.created_at), "PP")}
      </Base>
    ),
  },
  {
    title: "Titre",
    render: (item) => (
      <SectionSmall className="whitespace-nowrap">{item.title}</SectionSmall>
    ),
  },
  {
    title: "Devis",
    thClassName: "w-1",
    cellClassName: "justify-end",
    headClassName: "justify-end",
    render: (item) => (
      <>
        {item.for_no_quote ? (
          <Base>Non facturable / contrat</Base>
        ) : (
          <InvoiceRestDocument
            label="Devis"
            placeholder="Aucun devis"
            value={item.for_rel_quote}
            disabled
          />
        )}
      </>
    ),
  },
  {
    title: "Client",
    thClassName: "w-1",
    cellClassName: "justify-end",
    headClassName: "justify-end",
    render: (item) => (
      <>
        <RestDocumentsInput
          label="Clients"
          placeholder="Aucun client"
          entity="contacts"
          value={item.client}
          icon={(p) => <UserIcon {...p} />}
          render={(c) => getContactName(c)}
          size="sm"
          disabled
        />
      </>
    ),
  },
  {
    title: "Article",
    thClassName: "w-1",
    render: (item) => (
      <RestDocumentsInput
        disabled
        value={item.article}
        entity={"articles"}
        size="sm"
        icon={(p, article) => getArticleIcon((article as Articles)?.type)(p)}
      />
    ),
  },
  {
    title: "Étiquettes",
    thClassName: "w-1",
    cellClassName: "justify-end",
    headClassName: "justify-end",
    render: (item) => (
      <div className="space-x-2 whitespace-nowrap">
        <TagsInput value={item.tags} disabled />
        <UsersInput value={item.assigned} disabled />
      </div>
    ),
  },
  {
    thClassName: "w-1",
    cellClassName: "justify-end",
    render: (item) => (
      <Badge
        className={twMerge(
          "whitespace-nowrap",
          item.quantity_spent > item.quantity_expected &&
            "bg-red-100 text-red-800"
        )}
      >
        {formatQuantity(item.quantity_spent, "h")} /{" "}
        {formatQuantity(item.quantity_expected, "h")}
      </Badge>
    ),
  },
  {
    title: "Statut",
    thClassName: "w-1",
    cellClassName: "justify-end",
    render: (item) => (
      <ServiceItemStatus size="sm" readonly value={item.state} />
    ),
  },
];

registerCtrlKRestEntity<ServiceItems>("service_items", {
  renderEditor: (props) => (
    <ServiceItemsDetailsPage readonly={false} id={props.id} />
  ),
  renderResult: ServiceItemsColumns,
  useDefaultData: useServiceItemDefaultModel,
  viewRoute: ROUTES.ServiceItemsView,
  actions: (rows) => {
    // All from the same client
    if (_.uniqBy(rows, "client").length === 1) {
      return [
        {
          label: "Facturer la sélection",
          icon: (p) => <DocumentCheckIcon {...p} />,
          action: () => {
            document.location = getRoute(ROUTES.InvoicesFromItems, {
              ids: rows.map((a) => a.id).join(","),
            });
          },
        },
      ];
    }
    return [];
  },
});

export const ServiceTimesColumns: Column<ServiceTimes>[] = [
  {
    title: "Assigné",
    render: (item) => <UsersInput value={item.assigned} disabled />,
  },
  {
    title: "Temps passé",
    render: (item) => {
      return (
        <>
          {formatQuantity(item.quantity, item.unit || "h")}{" "}
          <Unit unit={item.unit || "h"} />
        </>
      );
    },
  },
  {
    title: "Travail effectué",
    render: (item) => item.description,
  },
];

export const useServiceTimeDefaultModel: () => Partial<ServiceTimes> =
  () => ({});

registerCtrlKRestEntity<ServiceTimes>("service_times", {
  renderEditor: (props) => (
    <ServiceTimesDetailsPage readonly={false} id={props.id} />
  ),
  renderResult: ServiceTimesColumns,
  useDefaultData: useServiceTimeDefaultModel,
  viewRoute: ROUTES.ServiceItemsView,
});
