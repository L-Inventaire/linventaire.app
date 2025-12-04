import { Button } from "@atoms/button/button";
import { Info } from "@atoms/text";
import { withSearchAsModel } from "@components/search-bar/utils/as-model";
import { RestTable } from "@components/table-rest";
import { useHasAccess } from "@features/access";
import {
  ContactsColumns,
  ContactsFieldsNames,
} from "@features/contacts/configuration";
import { useContacts } from "@features/contacts/hooks/use-contacts";
import { Contacts } from "@features/contacts/types/types";
import { ROUTES, getRoute } from "@features/routes";
import { formatNumber } from "@features/utils/format/strings";
import { useNavigateAlt } from "@features/utils/navigate";
import {
  RestOptions,
  useRestExporter,
  useRestSchema,
} from "@features/utils/rest/hooks/use-rest";
import { Pagination } from "@molecules/table/table";
import { PlusIcon } from "@heroicons/react/20/solid";
import { Page } from "@views/client/_layout/page";
import { useRef, useState } from "react";
import { SearchBar } from "../../../../components/search-bar";
import { schemaToSearchFields } from "../../../../components/search-bar/utils/utils";

export const ContactsPage = () => {
  const [options, setOptions] = useState<RestOptions<Contacts>>({
    limit: 20,
    offset: 0,
    index: "full_name,updated_at",
    asc: false,
    query: [],
  });
  const { contacts } = useContacts({
    ...options,
    query: (options?.query as any) || [],
    key: "main",
    useRankOrderOnSearch: true,
  });
  const schema = useRestSchema("contacts");
  const navigate = useNavigateAlt();
  const hasAccess = useHasAccess();
  const restExporter = useRestExporter<Contacts>("contacts");

  // Exporter function for contacts
  const exporter =
    (options: RestOptions<Contacts>) =>
    async (pagination: Pick<Pagination, "page" | "perPage">) => {
      const contactsList = await restExporter(options)(pagination);
      return contactsList.map((contact) => ({
        id: contact.id,
        name:
          [contact.person_first_name, contact.person_last_name]
            .filter(Boolean)
            .join(" ") ||
          contact.business_name ||
          "",
        business_name: contact.business_name || "",
        email: contact.email || "",
        phone: contact.phone || "",
        type: contact.type || "",
        address: [
          contact.address?.address_line_1,
          contact.address?.address_line_2,
          contact.address?.city,
          contact.address?.zip,
          contact.address?.country,
        ]
          .filter(Boolean)
          .join(", "),
        notes: contact.notes || "",
        tags: (contact.tags || []).join(", "),
        is_client: contact.is_client ? "Oui" : "Non",
        is_supplier: contact.is_supplier ? "Oui" : "Non",
        created_at: contact.created_at
          ? new Date(contact.created_at).toISOString().slice(0, 10)
          : "",
        updated_at: contact.updated_at
          ? new Date(contact.updated_at).toISOString().slice(0, 10)
          : "",
      }));
    };

  const resetToFirstPage = useRef<() => void>(() => {});

  return (
    <Page
      title={[{ label: "Contacts" }]}
      bar={
        <SearchBar
          schema={{
            table: "contacts",
            fields: schemaToSearchFields(schema.data, ContactsFieldsNames()),
          }}
          loading={schema.isPending}
          onChange={(q) => {
            if (q.valid) {
              setOptions({ ...options, query: q.fields });
              resetToFirstPage.current();
            }
          }}
          suffix={
            <>
              {hasAccess("CONTACTS_WRITE") && (
                <Button
                  className="shrink-0"
                  size="sm"
                  to={withSearchAsModel(
                    getRoute(ROUTES.ContactsEdit, { id: "new" }),
                    schema.data
                  )}
                  icon={(p) => <PlusIcon {...p} />}
                  shortcut={["shift+a"]}
                  hideTextOnMobile
                >
                  Ajouter un contact
                </Button>
              )}
            </>
          }
        />
      }
    >
      <div className="-m-3 overflow-auto max-w-[100vw]">
        <div className="px-3 h-7 w-full bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
          <Info>
            {formatNumber(contacts?.data?.total || 0)} contacts trouvés
          </Info>
        </div>

        <RestTable
          resetToFirstPage={(func) => (resetToFirstPage.current = func)}
          entity="contacts"
          onClick={({ id }, event) =>
            navigate(getRoute(ROUTES.ContactsView, { id }), { event })
          }
          data={contacts}
          showPagination="full"
          onRequestData={async (page) => {
            setOptions({
              ...options,
              limit: page.perPage,
              offset: (page.page - 1) * page.perPage,
              asc: (page.order || "").toLowerCase() !== "desc",
            });
          }}
          columns={ContactsColumns}
          onFetchExportData={exporter(options)}
        />
      </div>
    </Page>
  );
};
