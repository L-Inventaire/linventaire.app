import { Button } from "@atoms/button/button";
import { Title } from "@atoms/text";
import { Table } from "@components/table";
import { TagsInput } from "@components/tags-input";
import { useContacts } from "@features/contacts/hooks/use-contacts";
import { getContactName } from "@features/contacts/types/types";
import { ROUTES, getRoute } from "@features/routes";
import { Page, PageBlock } from "@views/client/_layout/page";
import { useState } from "react";
import { SearchBar } from "./components/search-bar";

export const ContactsPage = () => {
  const [options, setOptions] = useState({ limit: 10, offset: 0 });
  const { contacts } = useContacts(options);

  (window as any).setOptions = setOptions;
  return (
    <Page title={[{ label: "Contacts" }]}>
      <div className="float-right">
        <Button to={getRoute(ROUTES.ContactsEdit, { id: "new" })}>
          Ajouter un contact
        </Button>
      </div>
      <Title>Tous les contacts</Title>
      <div className="mb-4" />

      <SearchBar />
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
