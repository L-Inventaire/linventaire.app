import { Button } from "@atoms/button/button";
import { Info } from "@atoms/text";
import { withSearchAsModel } from "@components/search-bar/utils/as-model";
import { Table } from "@components/table";
import { TagsInput } from "@components/tags-input";
import { useArticles } from "@features/articles/hooks/use-articles";
import { Articles } from "@features/articles/types/types";
import { ROUTES, getRoute } from "@features/routes";
import {
  RestOptions,
  useRestSchema,
} from "@features/utils/rest/hooks/use-rest";
import { PlusIcon } from "@heroicons/react/20/solid";
import { Page } from "@views/client/_layout/page";
import { useState } from "react";
import { SearchBar } from "../../../../components/search-bar";
import { schemaToSearchFields } from "../../../../components/search-bar/utils/utils";

export const ArticlesPage = () => {
  const [options, setOptions] = useState<RestOptions<Articles>>({
    limit: 10,
    offset: 0,
    query: [],
  });
  const { articles } = useArticles(options);
  const schema = useRestSchema("articles");

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
            >
              Ajouter un article
            </Button>
          }
        />
      }
    >
      <div className="-m-3">
        <div className="px-3 h-7 w-full bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
          <Info>Some additional content</Info>
        </div>
        <Table
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
              title: "Name",
              orderable: true,
              render: (article) => article.name,
            },
            {
              title: "Price",
              orderable: true,
              render: (article) => <Info>{article.price}</Info>,
            },
            {
              title: "Tags",
              orderable: true,
              render: (article) => <TagsInput value={article.tags} disabled />,
            },
            {
              title: "Actions",
              thClassName: "w-1",
              render: ({ id }) => (
                <>
                  <Button size="sm" to={getRoute(ROUTES.ProductsView, { id })}>
                    View
                  </Button>
                </>
              ),
            },
          ]}
        />
      </div>
    </Page>
  );
};
