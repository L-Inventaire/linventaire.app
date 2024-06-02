import { Button } from "@atoms/button/button";
import { Title } from "@atoms/text";
import { Articles } from "@features/articles/types/types";
import { ROUTES, getRoute } from "@features/routes";
import { useDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { Page } from "@views/client/_layout/page";
import { useNavigate, useParams } from "react-router-dom";
import { ArticlesDetailsPage } from "../components/article-details";
import { PageLoader } from "@components/page-loader";
import _ from "lodash";
import { DocumentBar } from "@components/document-bar";

export const ArticlesEditPage = ({ readonly }: { readonly?: boolean }) => {
  let { id } = useParams();
  id = id === "new" ? "" : id || "";
  const navigate = useNavigate();

  // TODO this must not execute if we're in a modal /!\
  const initialModel = JSON.parse(
    new URLSearchParams(window.location.search).get("model") || "{}"
  ) as Articles;

  const {
    draft: article,
    save,
    isInitiating,
  } = useDraftRest<Articles>(
    "articles",
    id || "new",
    async (item) => {
      navigate(getRoute(ROUTES.ProductsView, { id: item.id }));
    },
    _.merge({ type: "product", tva: "20" }, initialModel) as Articles
  );

  return (
    <Page
      title={[
        { label: "Articles", to: getRoute(ROUTES.Products) },
        { label: id ? "Modifier" : "Créer" },
      ]}
      bar={
        <DocumentBar
          loading={isInitiating}
          document={article}
          mode={"write"}
          onSave={async () => await save()}
          backRoute={ROUTES.Products}
          viewRoute={ROUTES.ProductsView}
          prefix={<span>Créer un article</span>}
        />
      }
    >
      {isInitiating ? (
        <PageLoader />
      ) : (
        <ArticlesDetailsPage readonly={false} id={id} />
      )}
    </Page>
  );
};
