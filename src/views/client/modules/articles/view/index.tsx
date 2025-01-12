import { DocumentBar } from "@components/document-bar";
import { useArticle } from "@features/articles/hooks/use-articles";
import { ROUTES, getRoute } from "@features/routes";
import { Page } from "@views/client/_layout/page";
import { useParams } from "react-router-dom";
import { ArticlesDetailsPage } from "../components/article-details";
import { useHasAccess } from "@features/access";

export const ArticlesViewPage = (_props: { readonly?: boolean }) => {
  const { id } = useParams();
  const { article, isPending, remove, restore, isPendingModification } =
    useArticle(id || "");
  const hasAccess = useHasAccess();

  return (
    <Page
      loading={isPendingModification}
      title={[
        { label: "Articles", to: getRoute(ROUTES.Products) },
        { label: article?.name || "Article" },
      ]}
      bar={
        <DocumentBar
          loading={isPending && !article}
          entity={"articles"}
          document={article}
          mode={"read"}
          backRoute={ROUTES.Products}
          editRoute={
            hasAccess("ARTICLES_WRITE") ? ROUTES.ProductsEdit : undefined
          }
          viewRoute={ROUTES.ProductsView}
          onRemove={
            article?.id && hasAccess("ARTICLES_WRITE")
              ? async () => remove.mutateAsync(article?.id)
              : undefined
          }
          onRestore={
            article?.id && hasAccess("ARTICLES_WRITE")
              ? async () => restore.mutateAsync(article?.id)
              : undefined
          }
        />
      }
    >
      <div className="mt-6" />
      <ArticlesDetailsPage readonly={true} id={id || ""} />
    </Page>
  );
};
