import { Button } from "@atoms/button/button";
import { Info } from "@atoms/text";
import { RestTable } from "@components/table-rest";
import { ROUTES, getRoute } from "@features/routes";
import { ServiceItemsColumns } from "@features/service/configuration";
import { useServiceItems } from "@features/service/hooks/use-service-items";
import { ServiceItems } from "@features/service/types/types";
import { useNavigateAlt } from "@features/utils/navigate";
import {
  RestOptions,
  useRestSchema,
} from "@features/utils/rest/hooks/use-rest";
import { PlusIcon } from "@heroicons/react/16/solid";
import { Page } from "@views/client/_layout/page";
import { useState } from "react";
import { SearchBar } from "../../../../components/search-bar";
import { schemaToSearchFields } from "../../../../components/search-bar/utils/utils";
import { ServiceItemStatus } from "./components/service-item-status";

export const ServicePage = () => {
  const [options, setOptions] = useState<RestOptions<ServiceItems>>({
    limit: 10,
    offset: 0,
    query: [],
    index: "state,created_at",
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
          columns={ServiceItemsColumns}
          groupBy="state"
          groupByRender={(row) => (
            <div className="mt-px">
              <ServiceItemStatus size="xs" readonly value={row.state} />
            </div>
          )}
        />
      </div>
    </Page>
  );
};
