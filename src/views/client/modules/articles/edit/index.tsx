import { PageLoader } from "@atoms/page-loader";
import { DocumentBar } from "@components/document-bar";
import { useArticleDefaultModel } from "@features/articles/configuration";
import { Articles } from "@features/articles/types/types";
import { ROUTES, getRoute } from "@features/routes";
import { useDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { Page } from "@views/client/_layout/page";
import _ from "lodash";
import { useNavigate, useParams } from "react-router-dom";
import { ArticlesDetailsPage } from "../components/article-details";
import toast from "react-hot-toast";

export const ArticlesEditPage = (_props: { readonly?: boolean }) => {
  let { id } = useParams();
  id = id === "new" ? "" : id || "";
  const navigate = useNavigate();

  const defaultModel = useArticleDefaultModel();
  const initialModel = JSON.parse(
    new URLSearchParams(window.location.search).get("model") || "{}"
  ) as Articles;

  const {
    draft: article,
    save,
    isInitiating,
    remove,
    restore,
  } = useDraftRest<Articles>(
    "articles",
    id || "new",
    async (item) => {
      navigate(getRoute(ROUTES.ProductsView, { id: item.id }));
    },
    _.merge(defaultModel, initialModel) as Articles
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
          entity={"articles"}
          document={article}
          mode={"write"}
          onSave={async () => {
            if (!article?.name) {
              toast.error("Vous devez saisir le nom de l'article.");
              return;
            }
            if ((article?.suppliers ?? [])?.length === 0) {
              toast.error("Vous devez associer au moins un fournisseur.");
              return;
            }
            await save();
          }}
          backRoute={ROUTES.Products}
          viewRoute={ROUTES.ProductsView}
          prefix={<span>Créer un article</span>}
          onRemove={article.id ? remove : undefined}
          onRestore={article.id ? restore : undefined}
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
