import { Button } from "@atoms/button/button";
import { Title } from "@atoms/text";
import { Table } from "@components/table";
import { TagsInput } from "@components/tags-input";
import { useContacts } from "@features/contacts/hooks/use-contacts";
import { getContactName } from "@features/contacts/types/types";
import { ROUTES, getRoute } from "@features/routes";
import { Page } from "@views/client/_layout/page";
import { useState } from "react";
import { SearchBar } from "./components/search-bar";
import { useRestSchema } from "@features/utils/rest/hooks/use-rest";
import { flattenKeys } from "@features/utils/flatten";
import { SearchField } from "./components/search-bar/types";

export const ContactsPage = () => {
  const [options, setOptions] = useState({ limit: 10, offset: 0 });
  const { contacts } = useContacts(options);
  const schema = useRestSchema("contacts");

  return (
    <Page title={[{ label: "Contacts" }]}>
      <div className="float-right">
        <Button to={getRoute(ROUTES.ContactsEdit, { id: "new" })}>
          Ajouter un contact
        </Button>
      </div>
      <Title>Tous les contacts</Title>
      <div className="mb-4" />

      <SearchBar
        fields={Object.entries(flattenKeys(schema.data)).map(([key, value]) => {
          return { key, label: key, type: value as SearchField["type"] };
        })}
      />
      <div className="mb-4" />

      <Table
        loading={contacts.isPending}
        data={contacts.data || []}
        showPagination="full"
        columns={[
          {
            title: "Name",
            render: (contact) => getContactName(contact),
          },
          {
            title: "Tags",
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
