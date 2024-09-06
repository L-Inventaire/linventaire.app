import { SectionSmall } from "@atoms/text";
import { RestDocumentsInput } from "@components/input-rest";
import { Articles } from "@features/articles/types/types";
import { getContactName } from "@features/contacts/types/types";
import { registerCtrlKRestEntity } from "@features/ctrlk";
import { ROUTES } from "@features/routes";
import { UserIcon } from "@heroicons/react/16/solid";
import { Column } from "@molecules/table/table";
import { getArticleIcon } from "@views/client/modules/articles/components/article-icon";
import { ServiceItemStatus } from "@views/client/modules/service/components/service-item-status";
import { ServiceItemsDetailsPage } from "@views/client/modules/service/components/service-items-details";
import { ServiceTimesDetailsPage } from "@views/client/modules/service/components/service-times-details";
import { ServiceItems, ServiceTimes } from "./types/types";
import { RestUserTag } from "@components/deprecated-rest-tags/components/user";
import { UsersInput } from "@components/deprecated-users-input";

export const useServiceItemDefaultModel: () => Partial<ServiceItems> =
  () => ({});

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
    title: "Client",
    thClassName: "w-1",
    cellClassName: "justify-end",
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
    title: "Assigné",
    thClassName: "w-1",
    cellClassName: "justify-end",
    render: (item) => (
      <>
        <UsersInput value={item.assigned} disabled />
      </>
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
});

export const ServiceTimesColumns: Column<ServiceTimes>[] = [
  {
    title: "Assigné",
    render: (item) => <UsersInput value={item.assigned} disabled />,
  },
  {
    title: "Temps passé",
    render: (item) => item.quantity + " " + (item.unit || "unités"),
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
