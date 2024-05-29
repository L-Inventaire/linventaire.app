import { Button } from "@atoms/button/button";
import Tabs from "@atoms/tabs";
import { Info, Title } from "@atoms/text";
import { withSearchAsModel } from "@components/search-bar/utils/as-model";
import { Table } from "@components/table";
import { TagsInput } from "@components/tags-input";
import { UsersInput } from "@components/users-input";
import { useContacts } from "@features/contacts/hooks/use-contacts";
import { Contacts, getContactName } from "@features/contacts/types/types";
import { ROUTES, getRoute } from "@features/routes";
import {
  RestOptions,
  useRestSchema,
} from "@features/utils/rest/hooks/use-rest";
import { PlusIcon } from "@heroicons/react/outline";
import { Page } from "@views/client/_layout/page";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SearchBar } from "../../../../components/search-bar";
import { schemaToSearchFields } from "../../../../components/search-bar/utils/utils";

export const ContactsPage = () => {
  const [options, setOptions] = useState<RestOptions<Contacts>>({
    limit: 10,
    offset: 0,
    query: [],
  });
  const [type, setType] = useState("");
  const { contacts } = useContacts({
    ...options,
    query: [
      ...((options?.query as any) || []),
      ...(type === "clients"
        ? [
            {
              key: "is_client",
              values: [{ op: "equals", value: true }],
            },
          ]
        : []),
      ...(type === "suppliers"
        ? [
            {
              key: "is_supplier",
              values: [{ op: "equals", value: true }],
            },
          ]
        : []),
    ],
  });
  const schema = useRestSchema("contacts");
  const navigate = useNavigate();

  return (
    <Page title={[{ label: "Contacts" }]}>
      <div className="float-right">
        <Button
          className="ml-4"
          size="sm"
          to={withSearchAsModel(
            getRoute(ROUTES.ContactsEdit, { id: "new" }),
            schema.data
          )}
          icon={(p) => <PlusIcon {...p} />}
        >
          Ajouter un contact
        </Button>
      </div>
      <Title>Tous les contacts</Title>

      <Tabs
        tabs={[
          { value: "", label: "Tous" },
          { value: "clients", label: "Clients" },
          { value: "suppliers", label: "Fournisseurs" },
        ]}
        value={type}
        onChange={(v) => setType(v as string)}
      />
      <div className="mb-4" />

      <div className="flex flex-row space-x-2">
        <SearchBar
          schema={{
            table: "contacts",
            fields: schemaToSearchFields(schema.data, {
              tags: {
                label: "Étiquettes",
                keywords: "tags étiquettes label",
              },
              updated_at: "Date de mise à jour",
              updated_by: {
                label: "Mis à jour par",
                keywords: "updated_by mis à jour par auteur utilisateur user",
              },
              has_parents: {
                label: "A un parent",
                keywords: "parent ayant un parent",
              },
              email: "Email",
              phone: "Téléphone",
              is_supplier: "Fournisseur",
              is_client: "Client",
            }),
          }}
          onChange={(q) =>
            q.valid && setOptions({ ...options, query: q.fields })
          }
        />
      </div>
      <div className="mb-4" />

      <Table
        onClick={({ id }) => navigate(getRoute(ROUTES.ContactsView, { id }))}
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
            render: (contact) => (
              <div>
                {getContactName(contact)}{" "}
                <Info>{[contact.email, contact.phone].join(" ")}</Info>
              </div>
            ),
          },
          {
            render: (contact) => (
              <div className="w-full text-right flex space-x-1 justify-end">
                <TagsInput value={contact.tags} disabled />
                <UsersInput value={[contact.updated_by]} disabled />
              </div>
            ),
          },
        ]}
      />
    </Page>
  );
};
