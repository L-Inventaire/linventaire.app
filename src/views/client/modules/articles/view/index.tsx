import { DocumentBar } from "@components/document-bar";
import { useArticle } from "@features/articles/hooks/use-articles";
import { ROUTES, getRoute } from "@features/routes";
import { Page } from "@views/client/_layout/page";
import { useParams } from "react-router-dom";
import { ArticlesDetailsPage } from "../components/article-details";

export const ArticlesViewPage = ({ readonly }: { readonly?: boolean }) => {
  const { id } = useParams();
  const { article, isPending } = useArticle(id || "");

  return (
    <Page
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
          editRoute={ROUTES.ProductsEdit}
        />
      }
    >
      <ArticlesDetailsPage readonly={true} id={id || ""} />
    </Page>
  );
};
