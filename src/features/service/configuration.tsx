import { Unit } from "@atoms/input/input-unit";
import { SectionSmall } from "@atoms/text";
import { RestDocumentsInput } from "@components/input-rest";
import { TagsInput } from "@components/input-rest/tags";
import { Articles } from "@features/articles/types/types";
import { getContactName } from "@features/contacts/types/types";
import { registerCtrlKRestEntity } from "@features/ctrlk";
import { getRoute, ROUTES } from "@features/routes";
import { DocumentCheckIcon, UserIcon } from "@heroicons/react/16/solid";
import { Column } from "@molecules/table/table";
import { getArticleIcon } from "@views/client/modules/articles/components/article-icon";
import { ServiceItemStatus } from "@views/client/modules/service/components/service-item-status";
import { ServiceItemsDetailsPage } from "@views/client/modules/service/components/service-items-details";
import { ServiceTimesDetailsPage } from "@views/client/modules/service/components/service-times-details";
import { ServiceItems, ServiceTimes } from "./types/types";
import { InvoiceRestDocument } from "@views/client/modules/invoices/components/invoice-lines-input/invoice-input-rest-card";
import { Badge } from "@radix-ui/themes";
import { UsersInput } from "@components/input-rest/users";
import {
  prettyPrintTime,
  timeDecimalToBase60,
} from "@features/utils/format/dates";

export const useServiceItemDefaultModel: () => Partial<ServiceItems> = () => {
  return {
    state: "todo",
  };
};

export const ServiceItemsColumns: Column<ServiceItems>[] = [
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
        <InvoiceRestDocument
          label="Devis"
          placeholder="Aucun devis"
          value={item.for_rel_quote}
          disabled
        />
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
      <Badge className="whitespace-nowrap">
        {item.quantity_spent || 0} / {item.quantity_expected || 0}
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
          {prettyPrintTime(timeDecimalToBase60(item.quantity))}{" "}
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
