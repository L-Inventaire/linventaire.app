import { Button } from "@atoms/button/button";
import { Base, Info } from "@atoms/text";
import { RestDocumentsInput } from "@components/rest-documents-input";
import { RestTable } from "@components/rest-table";
import { ROUTES, getRoute } from "@features/routes";
import { useStockItems } from "@features/stock/hooks/use-stock-items";
import { StockItems } from "@features/stock/types/types";
import { formatNumber } from "@features/utils/format/strings";
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
import { StockItemStatus } from "./components/stock-item-status";

export const StockPage = () => {
  const [options, setOptions] = useState<RestOptions<StockItems>>({
    limit: 10,
    offset: 0,
    query: [],
  });
  const { stock_items } = useStockItems({
    ...options,
    query: [...((options?.query as any) || [])],
  });

  const schema = useRestSchema("stock_items");
  const navigate = useNavigateAlt();

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
              <Button
                size="xs"
                onClick={() =>
                  navigate(getRoute(ROUTES.StockEdit, { id: "new" }))
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
          <Info>{stock_items?.data?.total || 0} documents trouvés</Info>
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
          columns={[
            {
              thClassName: "w-1",
              render: (item) => (
                <Base className="opacity-50 whitespace-nowrap">
                  {item.serial_number}
                </Base>
              ),
            },
            {
              render: (item) => (
                <RestDocumentsInput
                  disabled
                  value={item.article}
                  entity={"articles"}
                />
              ),
            },
            {
              thClassName: "w-1",
              cellClassName: "justify-end",
              render: (item) => (
                <>
                  <RestDocumentsInput
                    disabled
                    value={item.client}
                    entity={"contacts"}
                  />
                </>
              ),
            },
            {
              thClassName: "w-1",
              cellClassName: "justify-end",
              render: (item) => (
                <Button size="xs" theme="outlined">
                  {formatNumber(item.quantity || 0)}
                  {" / "}
                  {formatNumber(item.original_quantity || 0)}
                </Button>
              ),
            },
            {
              thClassName: "w-1",
              cellClassName: "justify-end",
              render: (item) => (
                <StockItemStatus size="xs" readonly value={item.state} />
              ),
            },
          ]}
        />
      </div>
    </Page>
  );
};
