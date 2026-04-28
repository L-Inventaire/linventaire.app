import { Info } from "@/atoms/text";
import { SearchBar } from "@/components/search-bar";
import {
  buildQueryFromMap,
  schemaToSearchFields,
} from "@/components/search-bar/utils/utils";
import { RestTable } from "@/components/table-rest";
import { ReceivedEInvoicesColumns } from "@/features/e-invoicing/configuration";
import { useReceivedEInvoices } from "@/features/e-invoicing/hooks/use-received-e-invoices";
import { ReceivedEInvoices } from "@/features/e-invoicing/types/types";
import { getRoute, ROUTES } from "@/features/routes";
import { formatNumber } from "@/features/utils/format/strings";
import { useRouterState } from "@/features/utils/hooks/use-router-state";
import { useNavigateAlt } from "@/features/utils/navigate";
import {
  RestOptions,
  useRestSchema,
} from "@/features/utils/rest/hooks/use-rest";
import { Page } from "@/views/client/_layout/page";
import { Badge, Tabs } from "@radix-ui/themes";
import _ from "lodash";
import { useRef, useState } from "react";

export const ReceivedEInvoicesPage = () => {
  const schema = useRestSchema("received_e_invoices");
  const navigate = useNavigateAlt();
  const resetToFirstPage = useRef(() => {});

  const tabs = {
    new: {
      label: "Nouveaux",
      filter: buildQueryFromMap({ state: "new" }),
    },
    attached: {
      label: "Rattachées",
      filter: buildQueryFromMap({ state: "attached" }),
    },
    discarded: {
      label: "Rejetés",
      filter: buildQueryFromMap({ state: "discarded" }),
    },
  };
  const [activeTab, setActiveTab] = useRouterState("tab", "new");

  const [options, setOptions] = useState<RestOptions<ReceivedEInvoices>>({
    limit: 20,
    offset: 0,
    query: [],
  });

  const invoiceFilters = {
    ...options,
    query: [...((options?.query as any) || [])],
  };

  const invoicesQueryOptions = {
    ...invoiceFilters,
    query: [
      ...invoiceFilters.query,
      ...((tabs as any)[activeTab]?.filter || []),
    ],
    asc: true,
    key: "main-" + activeTab,
  };

  const { receivedEInvoices } = useReceivedEInvoices(invoicesQueryOptions);

  // Counters
  const { receivedEInvoices: newReceivedEInvoices } = useReceivedEInvoices({
    key: "newReceivedEInvoices",
    limit: 1,
    query: [...tabs.new.filter, ...invoiceFilters.query],
  });
  const { receivedEInvoices: attachedReceivedEInvoices } = useReceivedEInvoices(
    {
      key: "attachedReceivedEInvoices",
      limit: 1,
      query: [...tabs.attached.filter, ...invoiceFilters.query],
    },
  );
  const { receivedEInvoices: discardedReceivedEInvoices } =
    useReceivedEInvoices({
      key: "discardedReceivedEInvoices",
      limit: 1,
      query: [...tabs.discarded.filter, ...invoiceFilters.query],
    });
  const counters = {
    new: newReceivedEInvoices?.data?.total || 0,
    attached: attachedReceivedEInvoices?.data?.total || 0,
    discarded: discardedReceivedEInvoices?.data?.total || 0,
  };

  return (
    <Page
      title={[{ label: "Factures électroniques reçues" }]}
      bar={
        <SearchBar
          schema={{
            table: "invoices",
            fields: schemaToSearchFields(schema.data),
          }}
          loading={schema.isPending}
          onChangeDisplay={(d) => {
            setOptions({
              ...options,
            });
          }}
          onChange={(q, _) => {
            if (q.valid) {
              setOptions({
                ...options,
                query: q.fields,
              });
              resetToFirstPage.current();
            }
          }}
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
                  {!!(counters as any)?.[key] && (
                    <Badge className="ml-2">
                      {formatNumber((counters as any)?.[key] || 0)}
                    </Badge>
                  )}
                </Tabs.Trigger>
              ))}
              <div className="grow" />
              <Info className="pr-3">
                {formatNumber(receivedEInvoices?.data?.total || 0)} documents
                trouvés
              </Info>
            </Tabs.List>
          </Tabs.Root>
        </div>

        <RestTable
          resetToFirstPage={(f) => (resetToFirstPage.current = f)}
          entity="received_e_invoices"
          onClick={({ id }, event) =>
            navigate(getRoute(ROUTES.ReceivedEInvoicesView, { id }), { event })
          }
          data={receivedEInvoices}
          showPagination="full"
          onRequestData={async (page) => {
            setOptions({
              ...options,
              limit: page.perPage,
              offset: (page.page - 1) * page.perPage,
              asc: true,
            });
          }}
          columns={ReceivedEInvoicesColumns}
        />
      </div>
    </Page>
  );
};
