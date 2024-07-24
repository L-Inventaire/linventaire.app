import { Button } from "@atoms/button/button";
import { Base, Info } from "@atoms/text";
import { RestDocumentsInput } from "@components/input-rest";
import { RestTable } from "@components/table-rest";
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
import { UserIcon } from "@heroicons/react/20/solid";
import { getContactName } from "@features/contacts/types/types";
import { getArticleIcon } from "../articles/components/article-icon";
import { Articles } from "@features/articles/types/types";

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
                size="sm"
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
              render: (item) => (
                <Button size="sm" theme="outlined">
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
                <StockItemStatus size="sm" readonly value={item.state} />
              ),
            },
          ]}
        />
      </div>
    </Page>
  );
};
