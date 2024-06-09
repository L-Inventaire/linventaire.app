import { Button } from "@atoms/button/button";
import { Base, Info } from "@atoms/text";
import { withSearchAsModel } from "@components/search-bar/utils/as-model";
import { Table } from "@components/table";
import { TagsInput } from "@components/tags-input";
import { useArticles } from "@features/articles/hooks/use-articles";
import { Articles } from "@features/articles/types/types";
import { ROUTES, getRoute } from "@features/routes";
import { formatAmount } from "@features/utils/format/strings";
import { useNavigateAlt } from "@features/utils/navigate";
import {
  RestOptions,
  useRestSchema,
} from "@features/utils/rest/hooks/use-rest";
import { PlusIcon } from "@heroicons/react/20/solid";
import { Page } from "@views/client/_layout/page";
import { useState } from "react";
import { SearchBar } from "../../../../components/search-bar";
import { schemaToSearchFields } from "../../../../components/search-bar/utils/utils";
import { getTvaValue } from "../invoices/utils";

export const ArticlesPage = () => {
  const [options, setOptions] = useState<RestOptions<Articles>>({
    limit: 10,
    offset: 0,
    query: [],
  });
  const { articles } = useArticles(options);
  const schema = useRestSchema("articles");
  const navigate = useNavigateAlt();

  return (
    <Page
      title={[{ label: "Articles" }]}
      bar={
        <SearchBar
          schema={{
            table: "articles",
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
            }),
          }}
          onChange={(q) =>
            q.valid && setOptions({ ...options, query: q.fields })
          }
          suffix={
            <Button
              size="xs"
              to={withSearchAsModel(
                getRoute(ROUTES.ProductsEdit, { id: "new" }),
                schema.data
              )}
              icon={(p) => <PlusIcon {...p} />}
              shortcut={["shift+a"]}
            >
              Ajouter un article
            </Button>
          }
        />
      }
    >
      <div className="-m-3">
        <div className="px-3 h-7 w-full bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
          <Info>{articles?.data?.total || 0} articles trouvés</Info>
        </div>
        <Table
          onClick={({ id }, event) =>
            navigate(getRoute(ROUTES.ProductsView, { id }), { event })
          }
          loading={articles.isPending}
          data={articles?.data?.list || []}
          total={articles?.data?.total || 0}
          showPagination="simple"
          rowIndex="id"
          onSelect={(items) => false && console.log(items)}
          onRequestData={async (page) => {
            setOptions({
              ...options,
              limit: page.perPage,
              offset: (page.page - 1) * page.perPage,
              asc: page.order === "ASC",
              index:
                page.orderBy === undefined
                  ? undefined
                  : [
                      "business_name,person_first_name,person_last_name,business_registered_name",
                      "tags",
                    ][page.orderBy],
            });
          }}
          columns={[
            {
              thClassName: "w-1 whitespace-nowrap",
              render: (article) => (
                <Base className="opacity-50">{article.internal_reference}</Base>
              ),
            },
            {
              render: (article) => article.name,
            },
            {
              thClassName: "w-1",
              cellClassName: "justify-end",
              render: (article) => (
                <Button size="xs" theme="outlined">
                  Achat{" "}
                  {Object.values(article.suppliers_details || {})
                    .filter((a) => a.price)
                    .map((a) => formatAmount(a.price))
                    // Keep only min and max
                    .sort()
                    .filter((_, i, arr) => i === 0 || i === arr.length - 1)
                    .join("-")}{" "}
                  HT
                </Button>
              ),
            },
            {
              thClassName: "w-1",
              cellClassName: "justify-end",
              render: (article) => (
                <Button size="xs" theme="outlined">
                  Vente {formatAmount(article.price)} HT
                </Button>
              ),
            },
            {
              thClassName: "w-1",
              cellClassName: "justify-end",
              render: (article) => (
                <Button size="xs" theme="outlined">
                  {formatAmount(article.price * (1 + getTvaValue(article.tva)))}{" "}
                  TTC
                </Button>
              ),
            },
            {
              thClassName: "w-1",
              render: (article) => (
                <div className="w-full text-right flex space-x-1 justify-end items-center whitespace-nowrap">
                  <TagsInput value={article.tags} disabled />
                </div>
              ),
            },
          ]}
        />
      </div>
    </Page>
  );
};
