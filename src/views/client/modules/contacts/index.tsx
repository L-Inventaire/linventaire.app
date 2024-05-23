import { Button } from "@atoms/button/button";
import InputDate from "@atoms/input/input-date";
import Select from "@atoms/input/input-select";
import { Info, Title } from "@atoms/text";
import { Table } from "@components/table";
import { TagsInput } from "@components/tags-input";
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
import { SearchBar } from "../../../../components/search-bar";
import { schemaToSearchFields } from "../../../../components/search-bar/utils/utils";
import Tabs from "@atoms/tabs";
import { useNavigate } from "react-router-dom";
import { UsersInput } from "@components/users-input";

export const ContactsPage = () => {
  const [options, setOptions] = useState<RestOptions<Contacts>>({
    limit: 10,
    offset: 0,
    query: [],
  });
  const { contacts } = useContacts(options);
  const schema = useRestSchema("contacts");
  const navigate = useNavigate();

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

      <Tabs
        tabs={[
          { value: "", label: "Tous" },
          { value: "clients", label: "Clients" },
          { value: "suppliers", label: "Fournisseurs" },
        ]}
        value={""}
        onChange={console.log}
      />
      <div className="mb-4" />

      <div className="flex flex-row space-x-2">
        {false && (
          <>
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
                className="rounded-l-none -ml-px hover:z-10"
                placeholder="To"
              />
            </div>
          </>
        )}
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
                <UsersInput value={[contact.updated_by]} disabled heads />
              </div>
            ),
          },
        ]}
      />
    </Page>
  );
};
