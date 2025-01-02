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
import {
  buildQueryFromMap,
  schemaToSearchFields,
} from "../../../../components/search-bar/utils/utils";
import { ServiceItemStatus } from "./components/service-item-status";
import { Badge, Tabs } from "@radix-ui/themes";
import { formatNumber } from "@features/utils/format/strings";
import { useHasAccess } from "@features/access";

export const ServicePage = () => {
  const tabs = {
    active: {
      label: "Actifs",
      filter: [
        {
          key: "state",
          not: true,
          values: [
            {
              op: "equals",
              value: "done",
            },
            {
              op: "equals",
              value: "cancelled",
            },
          ],
        },
      ],
    },
    no_quote: {
      label: "À facturer",
      filter: [
        ...buildQueryFromMap({ state: "done" }),
        {
          key: "for_rel_quote",
          not: true,
          values: [{ op: "regex", value: ".+" }],
        },
        {
          key: "for_no_quote",
          not: true,
          values: [{ op: "equals", value: true }],
        },
      ],
    },
    done: {
      label: "Fermés",
      filter: buildQueryFromMap({ state: ["done", "cancelled"] }),
    },
    all: { label: "Tous", filter: [] },
  };
  const [activeTab, setActiveTab] = useState("active");

  const [options, setOptions] = useState<RestOptions<ServiceItems>>({
    limit: 20,
    offset: 0,
    query: [],
    index: "state_order,started_at desc",
  });
  const { service_items } = useServiceItems({
    ...options,
    query: [
      ...((options?.query as any) || []),
      ...((tabs as any)[activeTab]?.filter || []),
    ],
  });

  const schema = useRestSchema("service_items");
  const navigate = useNavigateAlt();
  const hasAccess = useHasAccess();

  // Counters
  const { service_items: activeServiceItems } = useServiceItems({
    key: "activeServices",
    limit: 1,
    query: [...((options?.query as any) || []), ...tabs.active.filter],
  });
  const { service_items: noQuoteServiceItems } = useServiceItems({
    key: "noQuoteServices",
    limit: 1,
    query: [...((options?.query as any) || []), ...tabs.no_quote.filter],
  });

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
              {hasAccess("ONSITE_SERVICES_WRITE") && (
                <Button
                  size="sm"
                  onClick={() =>
                    navigate(getRoute(ROUTES.ServiceItemsEdit, { id: "new" }))
                  }
                  icon={(p) => <PlusIcon {...p} />}
                  hideTextOnMobile
                >
                  Ajouter
                </Button>
              )}
            </>
          }
        />
      }
    >
      <div className="-m-3 overflow-auto max-w-[100vw]">
        <div className="px-3 min-h-7 w-full bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
          <Tabs.Root
            onValueChange={(v) => {
              setActiveTab(v);
            }}
            value={activeTab}
          >
            <Tabs.List className="flex space-x-2 -mx-3 -mb-px items-center">
              {Object.entries(tabs).map(([key, label]) => (
                <Tabs.Trigger key={key} value={key}>
                  {label.label}
                  {["active", "no_quote"].includes(key) && (
                    <Badge className="ml-2">
                      {key === "active"
                        ? formatNumber(activeServiceItems?.data?.total || 0)
                        : formatNumber(noQuoteServiceItems?.data?.total || 0)}
                    </Badge>
                  )}
                </Tabs.Trigger>
              ))}
              <div className="grow" />
              <Info className="pr-3">
                {formatNumber(service_items?.data?.total || 0)} documents
                trouvés
              </Info>
            </Tabs.List>
          </Tabs.Root>
        </div>
        <RestTable
          entity="service_items"
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
