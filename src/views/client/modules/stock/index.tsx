import { Button } from "@atoms/button/button";
import { Info } from "@atoms/text";
import { RestTable } from "@components/table-rest";
import { ROUTES, getRoute } from "@features/routes";
import { StockItemsColumns } from "@features/stock/configuration";
import { useStockItems } from "@features/stock/hooks/use-stock-items";
import { StockItems } from "@features/stock/types/types";
import { formatNumber } from "@features/utils/format/strings";
import { useNavigateAlt } from "@features/utils/navigate";
import {
  RestOptions,
  useRestSchema,
} from "@features/utils/rest/hooks/use-rest";
import { PlusIcon } from "@heroicons/react/16/solid";
import { Tabs } from "@radix-ui/themes";
import { Page } from "@views/client/_layout/page";
import { useState } from "react";
import { SearchBar } from "../../../../components/search-bar";
import {
  buildQueryFromMap,
  schemaToSearchFields,
} from "../../../../components/search-bar/utils/utils";
import { StockItemStatus } from "./components/stock-item-status";
import { useHasAccess } from "@features/access";

export const StockPage = () => {
  const tabs = {
    all: { label: "Tous", filter: [] },
    available: {
      label: "Disponible",
      filter: [
        ...buildQueryFromMap({
          state: ["stock", "in_transit", "delivered"],
        }),
        {
          key: "for_rel_quote",
          not: true,
          regex: true,
          values: [
            {
              op: "regex",
              value: ".+",
            },
          ],
        },
      ],
    },
    reserved: {
      label: "Reservé",
      filter: [
        ...buildQueryFromMap({
          state: ["stock", "in_transit"],
        }),
        {
          key: "for_rel_quote",
          regex: true,
          values: [
            {
              op: "regex",
              value: ".+",
            },
          ],
        },
      ],
    },
  };
  const [activeTab, setActiveTab] = useState("all");

  const [options, setOptions] = useState<RestOptions<StockItems>>({
    limit: 20,
    offset: 0,
    query: [],
    index: "state_order,created_at desc",
  });
  const { stock_items } = useStockItems({
    ...options,
    query: [
      ...((options?.query as any) || []),
      ...(tabs as any)[activeTab].filter,
    ],
  });

  const schema = useRestSchema("stock_items");
  const navigate = useNavigateAlt();
  const hasAccess = useHasAccess();

  return (
    <Page
      title={[{ label: "Stock" }]}
      bar={
        <SearchBar
          schema={{
            table: "Stock",
            fields: schemaToSearchFields(schema.data, {}),
          }}
          onChange={(q) =>
            q.valid && setOptions({ ...options, query: q.fields })
          }
          suffix={
            <>
              {hasAccess("STOCK_WRITE") && (
                <Button
                  size="sm"
                  onClick={() =>
                    navigate(getRoute(ROUTES.StockEdit, { id: "new" }))
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
                </Tabs.Trigger>
              ))}
              <div className="grow" />
              <Info className="pr-3">
                {formatNumber(stock_items?.data?.total || 0)} documents trouvés
              </Info>
            </Tabs.List>
          </Tabs.Root>
        </div>
        <RestTable
          entity="stock_items"
          onClick={({ id }, event) =>
            navigate(getRoute(ROUTES.StockView, { id }), { event })
          }
          data={stock_items}
          showPagination="full"
          onRequestData={async (page) => {
            setOptions({
              ...options,
              limit: page.perPage,
              offset: (page.page - 1) * page.perPage,
              asc: page.order === "ASC",
            });
          }}
          columns={StockItemsColumns}
          groupBy="state"
          groupByRender={(row) => (
            <div className="mt-px">
              <StockItemStatus size="xs" readonly value={row.state} />
            </div>
          )}
        />
      </div>
    </Page>
  );
};
