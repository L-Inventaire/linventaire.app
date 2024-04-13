import { Button } from "@atoms/button/button";
import { Title } from "@atoms/text";
import { Table } from "@components/table";
import { TagsInput } from "@components/tags-input";
import { useContacts } from "@features/contacts/hooks/use-contacts";
import { Contacts, getContactName } from "@features/contacts/types/types";
import { ROUTES, getRoute } from "@features/routes";
import { flattenKeys } from "@features/utils/flatten";
import {
  RestOptions,
  useRestSchema,
} from "@features/utils/rest/hooks/use-rest";
import { Page } from "@views/client/_layout/page";
import { useState } from "react";
import { SearchBar } from "./components/search-bar";
import { SearchField } from "./components/search-bar/utils/types";
import Select from "@atoms/input/input-select";
import {
  CogIcon,
  DotsHorizontalIcon,
  PlusIcon,
} from "@heroicons/react/outline";
import InputDate from "@atoms/input/input-date";
import { schemaToSearchFields } from "./components/search-bar/utils/utils";

export const ContactsPage = () => {
  const [options, setOptions] = useState<RestOptions<Contacts>>({
    limit: 10,
    offset: 0,
    query: [],
  });
  const { contacts } = useContacts(options);
  const schema = useRestSchema("contacts");

  return (
    <Page title={[{ label: "Contacts" }]}>
      <div className="float-right">
        <Button
          className="ml-4"
          size="sm"
          to={getRoute(ROUTES.ContactsEdit, { id: "new" })}
          icon={(p) => <PlusIcon {...p} />}
        >
          Ajouter un contact
        </Button>
      </div>
      <Title>Tous les contacts</Title>
      <div className="mb-4" />

      <div className="flex flex-row space-x-2">
        <Select className="w-max">
          <option>Tous</option>
          <option>Clients</option>
          <option>Fournisseurs</option>
          <option>Aucun</option>
        </Select>
        <div className="flex flex-row relative">
          <InputDate
            className="rounded-r-none -mr-px hover:z-10"
            placeholder="From"
          />
          <InputDate
            className="rounded-l-none -mlŒ-px hover:z-10"
            placeholder="To"
          />
        </div>
        <SearchBar
          fields={schemaToSearchFields(schema.data)}
          onChange={(q) =>
            q.valid && setOptions({ ...options, query: q.fields })
          }
        />
        <Button theme="default" icon={(p) => <DotsHorizontalIcon {...p} />} />
      </div>
      <div className="mb-4" />

      <Table
        loading={contacts.isPending}
        data={contacts?.data?.list || []}
        total={contacts?.data?.total || 0}
        showPagination="full"
        rowIndex="id"
        onSelect={(items) => false && console.log(items)}
        onRequestData={async (page) => {
          setOptions({
            ...options,
            limit: page.perPage,
            offset: (page.page - 1) * page.perPage,
            asc: page.order === "ASC",
            index:
              page.orderBy === undefined
                ? undefined
                : [
                    "business_name,person_first_name,person_last_name,business_registered_name",
                    "tags",
                  ][page.orderBy],
          });
        }}
        columns={[
          {
            title: "Name",
            orderable: true,
            render: (contact) => getContactName(contact),
          },
          {
            title: "Tags",
            orderable: true,
            render: (contact) => <TagsInput value={contact.tags} disabled />,
          },
          {
            title: "Actions",
            thClassName: "w-1",
            render: ({ id }) => (
              <>
                <Button size="sm" to={getRoute(ROUTES.ContactsView, { id })}>
                  View
                </Button>
              </>
            ),
          },
        ]}
      />
    </Page>
  );
};
