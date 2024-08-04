import { Button } from "@atoms/button/button";
import { Base, Info } from "@atoms/text";
import { RestDocumentsInput } from "@components/input-rest";
import { RestTable } from "@components/table-rest";
import { Articles } from "@features/articles/types/types";
import { getContactName } from "@features/contacts/types/types";
import { ROUTES, getRoute } from "@features/routes";
import { useServiceItems } from "@features/service/hooks/use-service-items";
import { ServiceItems } from "@features/service/types/types";
import { useNavigateAlt } from "@features/utils/navigate";
import {
  RestOptions,
  useRestSchema,
} from "@features/utils/rest/hooks/use-rest";
import { PlusIcon } from "@heroicons/react/16/solid";
import { UserIcon } from "@heroicons/react/20/solid";
import { Page } from "@views/client/_layout/page";
import { useState } from "react";
import { SearchBar } from "../../../../components/search-bar";
import { schemaToSearchFields } from "../../../../components/search-bar/utils/utils";
import { getArticleIcon } from "../articles/components/article-icon";
import { ServiceItemStatus } from "./components/service-item-status";

export const ServicePage = () => {
  const [options, setOptions] = useState<RestOptions<ServiceItems>>({
    limit: 10,
    offset: 0,
    query: [],
  });
  const { service_items } = useServiceItems({
    ...options,
    query: [...((options?.query as any) || [])],
  });

  const schema = useRestSchema("stock_items");
  const navigate = useNavigateAlt();

  return (
    <Page
      title={[{ label: "Service" }]}
      bar={
        <SearchBar
          schema={{
            table: "Service",
            fields: schemaToSearchFields(schema.data, {}),
          }}
          onChange={(q) =>
            q.valid && setOptions({ ...options, query: q.fields })
          }
          suffix={
            <>
              <Button
                size="sm"
                onClick={() =>
                  navigate(getRoute(ROUTES.ServiceItemsEdit, { id: "new" }))
                }
                icon={(p) => <PlusIcon {...p} />}
              >
                Ajouter
              </Button>
            </>
          }
        />
      }
    >
      <div className="-m-3">
        <div className="px-3 h-7 w-full bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
          <Info>{service_items?.data?.total || 0} documents trouvés</Info>
        </div>
        <RestTable
          entity="stock_items"
          onClick={({ id }, event) =>
            navigate(getRoute(ROUTES.ServiceItemsView, { id }), { event })
          }
          data={service_items}
          showPagination="full"
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
              render: (item) => (
                <Base className="opacity-50 whitespace-nowrap">
                  {item.notes}
                </Base>
              ),
            },
            {
              render: (item) => (
                <RestDocumentsInput
                  disabled
                  value={item.article}
                  entity={"articles"}
                  size="sm"
                  icon={(p, article) =>
                    getArticleIcon((article as Articles)?.type)(p)
                  }
                />
              ),
            },
            {
              thClassName: "w-1",
              cellClassName: "justify-end",
              render: (item) => (
                <>
                  <RestDocumentsInput
                    label="Fournisseur"
                    placeholder="Aucun fournisseur"
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
              thClassName: "w-1",
              cellClassName: "justify-end",
              render: () => <></>,
            },
            {
              thClassName: "w-1",
              cellClassName: "justify-end",
              render: (item) => (
                <ServiceItemStatus size="sm" readonly value={item.state} />
              ),
            },
          ]}
        />
      </div>
    </Page>
  );
};
