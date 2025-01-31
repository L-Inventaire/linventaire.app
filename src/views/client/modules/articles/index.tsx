import { Button } from "@atoms/button/button";
import { Info } from "@atoms/text";
import { withSearchAsModel } from "@components/search-bar/utils/as-model";
import { RestTable } from "@components/table-rest";
import {
  ArticlesColumns,
  ArticlesFieldsNames,
} from "@features/articles/configuration";
import { useArticles } from "@features/articles/hooks/use-articles";
import { Articles } from "@features/articles/types/types";
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

export const ArticlesPage = () => {
  const [options, setOptions] = useState<RestOptions<Articles>>({
    limit: 20,
    offset: 0,
    query: [],
  });
  const { articles } = useArticles(options);
  const schema = useRestSchema("articles");
  const navigate = useNavigateAlt();
  const hasAccess = useHasAccess();

  const resetToFirstPage = useRef<() => void>(() => {});

  return (
    <Page
      title={[{ label: "Articles" }]}
      bar={
        <SearchBar
          schema={{
            table: "articles",
            fields: schemaToSearchFields(schema.data, ArticlesFieldsNames()),
          }}
          onChange={(q) => {
            if (q.valid) {
              setOptions({ ...options, query: q.fields });
              resetToFirstPage.current();
            }
          }}
          suffix={
            <>
              {hasAccess("ARTICLES_WRITE") && (
                <Button
                  size="sm"
                  to={withSearchAsModel(
                    getRoute(ROUTES.ProductsEdit, { id: "new" }),
                    schema.data
                  )}
                  icon={(p) => <PlusIcon {...p} />}
                  shortcut={["shift+a"]}
                  hideTextOnMobile
                >
                  Ajouter un article
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
            {formatNumber(articles?.data?.total || 0)} articles trouvés
          </Info>
        </div>
        <RestTable
          resetToFirstPage={(reset) => (resetToFirstPage.current = reset)}
          entity="articles"
          showPagination="full"
          onClick={({ id }, event) =>
            navigate(getRoute(ROUTES.ProductsView, { id }), { event })
          }
          groupBy="type"
          groupByRender={(type) =>
            ArticlesColumns.find((c) => c.id === "type")?.render?.(type, {})
          }
          data={articles}
          onRequestData={async (page) => {
            setOptions({
              ...options,
              limit: page.perPage,
              offset: (page.page - 1) * page.perPage,
              asc: true,
              index: "type,name",
            });
          }}
          columns={ArticlesColumns}
        />
      </div>
    </Page>
  );
};
