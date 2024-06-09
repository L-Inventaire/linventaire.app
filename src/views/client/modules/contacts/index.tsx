import { Button } from "@atoms/button/button";
import { Info } from "@atoms/text";
import { RestDocumentsInput } from "@components/rest-documents-input";
import { withSearchAsModel } from "@components/search-bar/utils/as-model";
import { Table } from "@components/table";
import { TagsInput } from "@components/tags-input";
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
import { SearchBar } from "../../../../components/search-bar";
import { schemaToSearchFields } from "../../../../components/search-bar/utils/utils";
import { useNavigateAlt } from "@features/utils/navigate";

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
  const navigate = useNavigateAlt();

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
              shortcut={["shift+a"]}
            >
              Ajouter un contact
            </Button>
          }
        />
      }
    >
      <div className="-m-3">
        <div className="px-3 h-7 w-full bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
          <Info>{contacts?.data?.total || 0} contacts trouvés</Info>
        </div>
        <Table
          onClick={({ id }, event) =>
            navigate(getRoute(ROUTES.ContactsView, { id }), { event })
          }
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
              thClassName: "w-1",
              render: (contact) => (
                <div className="space-x-2 flex items-center">
                  <Button
                    className={
                      !contact.is_supplier && !contact.is_client
                        ? "opacity-50"
                        : ""
                    }
                    size="xs"
                    theme="outlined"
                    data-tooltip={
                      contact.is_supplier && contact.is_client
                        ? "Fournisseur et client"
                        : contact.is_supplier
                        ? "Fournisseur"
                        : contact.is_client
                        ? "Client"
                        : "Aucun"
                    }
                    icon={(p) =>
                      contact.is_supplier && contact.is_client ? (
                        <>
                          <UserIconSolid {...p} />
                          <BuildingStorefrontIcon {...p} />
                        </>
                      ) : contact.is_supplier ? (
                        <UserIconSolid {...p} />
                      ) : contact.is_client ? (
                        <BuildingStorefrontIcon {...p} />
                      ) : (
                        <></>
                      )
                    }
                  >
                    {contact.is_supplier && contact.is_client
                      ? "Tous"
                      : contact.is_supplier
                      ? "Fourn."
                      : contact.is_client
                      ? "Client"
                      : "Aucun"}
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
                    data-tooltip={
                      contact.type === "person" ? "Personne" : "Entreprise"
                    }
                    icon={(p) =>
                      contact.type === "person" ? (
                        <UserIcon {...p} />
                      ) : (
                        <BuildingOfficeIcon {...p} />
                      )
                    }
                  />
                  <span>
                    {getContactName(contact)}{" "}
                    <span className="opacity-50">
                      {[contact.email, contact.phone].join(" ")}
                    </span>
                  </span>
                </div>
              ),
            },
            {
              thClassName: "w-1",
              render: (contact) => (
                <div className="w-full text-right flex space-x-1 justify-end items-center whitespace-nowrap">
                  {(contact.parents?.length || 0) > 0 && (
                    <RestDocumentsInput
                      value={contact.parents}
                      table="contacts"
                      column="parents"
                      disabled
                      size="sm"
                      icon={(p) => <ShareIcon {...p} />}
                    />
                  )}{" "}
                  <TagsInput
                    size="sm"
                    value={contact.tags}
                    disabled
                    hideEmpty
                  />
                </div>
              ),
            },
          ]}
        />
      </div>
    </Page>
  );
};
