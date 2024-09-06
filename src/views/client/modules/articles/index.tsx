import { Button } from "@atoms/button/button";
import { Info } from "@atoms/text";
import { withSearchAsModel } from "@components/search-bar/utils/as-model";
import { RestTable } from "@components/table-rest";
import { ArticlesColumns } from "@features/articles/configuration";
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
              size="sm"
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
        <RestTable
          entity="articles"
          showPagination="full"
          onClick={({ id }, event) =>
            navigate(getRoute(ROUTES.ProductsView, { id }), { event })
          }
          data={articles}
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
          columns={ArticlesColumns}
        />
      </div>
    </Page>
  );
};
