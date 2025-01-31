import { Button } from "@atoms/button/button";
import { Info } from "@atoms/text";
import { withSearchAsModel } from "@components/search-bar/utils/as-model";
import { RestTable } from "@components/table-rest";
import {
  ContactsColumns,
  ContactsFieldsNames,
} from "@features/contacts/configuration";
import { useContacts } from "@features/contacts/hooks/use-contacts";
import { Contacts } from "@features/contacts/types/types";
import { ROUTES, getRoute } from "@features/routes";
import { useNavigateAlt } from "@features/utils/navigate";
import {
  RestOptions,
  useRestSchema,
} from "@features/utils/rest/hooks/use-rest";
import { PlusIcon } from "@heroicons/react/20/solid";
import { Page } from "@views/client/_layout/page";
import { useRef, useState } from "react";
import { SearchBar } from "../../../../components/search-bar";
import { schemaToSearchFields } from "../../../../components/search-bar/utils/utils";
import { formatNumber } from "@features/utils/format/strings";
import { useHasAccess } from "@features/access";

export const ContactsPage = () => {
  const [options, setOptions] = useState<RestOptions<Contacts>>({
    limit: 20,
    offset: 0,
    query: [],
  });
  const { contacts } = useContacts({
    ...options,
    query: (options?.query as any) || [],
  });
  const schema = useRestSchema("contacts");
  const navigate = useNavigateAlt();
  const hasAccess = useHasAccess();

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
              asc: page.order === "ASC",
            });
          }}
          columns={ContactsColumns}
        />
      </div>
    </Page>
  );
};
