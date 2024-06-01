import { Button } from "@atoms/button/button";
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
import { PlusIcon } from "@heroicons/react/20/solid";
import {
  BuildingOfficeIcon,
  ShareIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import {
  BuildingStorefrontIcon,
  UserIcon as UserIconSolid,
} from "@heroicons/react/24/solid";
import { Page } from "@views/client/_layout/page";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SearchBar } from "../../../../components/search-bar";
import { schemaToSearchFields } from "../../../../components/search-bar/utils/utils";
import { Info } from "@atoms/text";

export const ContactsPage = () => {
  const [options, setOptions] = useState<RestOptions<Contacts>>({
    limit: 10,
    offset: 0,
    query: [],
  });
  const { contacts } = useContacts({
    ...options,
    query: (options?.query as any) || [],
  });
  const schema = useRestSchema("contacts");
  const navigate = useNavigate();

  return (
    <Page
      title={[{ label: "Contacts" }]}
      bar={
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
          suffix={
            <Button
              className="shrink-0"
              size="xs"
              to={withSearchAsModel(
                getRoute(ROUTES.ContactsEdit, { id: "new" }),
                schema.data
              )}
              icon={(p) => <PlusIcon {...p} />}
            >
              Ajouter un contact
            </Button>
          }
        />
      }
    >
      <div className="-m-3">
        <div className="px-3 h-7 w-full bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
          <Info>Some additional content</Info>
        </div>
        <Table
          onClick={({ id }) => navigate(getRoute(ROUTES.ContactsView, { id }))}
          loading={contacts.isPending}
          data={contacts?.data?.list || []}
          total={contacts?.data?.total || 0}
          showPagination="simple"
          rowIndex="id"
          onSelect={(items) => false && console.log(items)}
          onRequestData={async (page) => {
            setOptions({
              ...options,
              limit: page.perPage,
              offset: (page.page - 1) * page.perPage,
              asc: page.order === "ASC",
            });
          }}
          columns={[
            {
              thClassName: "w-max",
              render: (contact) => (
                <div className="space-x-2 flex items-center">
                  <Button
                    size="xs"
                    theme="outlined"
                    icon={(p) =>
                      contact.is_supplier && contact.is_client ? (
                        <>
                          <UserIconSolid {...p} />
                          <BuildingStorefrontIcon {...p} />
                        </>
                      ) : contact.is_supplier ? (
                        <UserIconSolid {...p} />
                      ) : (
                        <BuildingStorefrontIcon {...p} />
                      )
                    }
                  >
                    {contact.is_supplier && contact.is_client
                      ? "Les deux"
                      : contact.is_supplier
                      ? "Fournisseur"
                      : "Client"}
                  </Button>
                </div>
              ),
            },
            {
              render: (contact) => (
                <div className="flex space-x-2 items-center">
                  <Button
                    size="xs"
                    theme="outlined"
                    icon={(p) =>
                      contact.type === "person" ? (
                        <UserIcon {...p} />
                      ) : (
                        <BuildingOfficeIcon {...p} />
                      )
                    }
                  />
                  <span>{getContactName(contact)}</span>
                  <span className="opacity-50">
                    {[contact.email, contact.phone].join(" ")}
                  </span>
                </div>
              ),
            },
            {
              render: (contact) => (
                <div className="w-full text-right flex space-x-1 justify-end">
                  {(contact.parents?.length || 0) > 0 && (
                    <Button
                      size="xs"
                      theme="outlined"
                      icon={(p) => <ShareIcon {...p} />}
                      to={getRoute(
                        // TODO: this is not working + needs some function to build it would be better
                        ROUTES.Contacts +
                          '?q=parents%3A"Test+3"&map=%7B"parents%3ATest+3"%3A"' +
                          contact.parents[0] +
                          '"%7D'
                      )}
                    >
                      {contact.parents[0]}
                    </Button>
                  )}
                  <TagsInput size="xs" value={contact.tags} disabled />
                  <UsersInput value={[contact.updated_by]} disabled />
                </div>
              ),
            },
          ]}
        />
      </div>
    </Page>
  );
};
