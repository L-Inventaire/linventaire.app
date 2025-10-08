import { PageLoader } from "@atoms/page-loader";
import { DocumentBar } from "@components/document-bar";
import { useArticleDefaultModel } from "@features/articles/configuration";
import { Articles } from "@features/articles/types/types";
import { useParamsOrContextId } from "@features/ctrlk";
import { ROUTES, getRoute } from "@features/routes";
import { useDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { Page } from "@views/client/_layout/page";
import _ from "lodash";
import { useRef } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { ArticlesDetailsPage } from "../components/article-details";
import { getUrlModel } from "@components/search-bar/utils/as-model";

export const ArticlesEditPage = (_props: { readonly?: boolean }) => {
  let { id } = useParamsOrContextId();
  id = id === "new" ? "" : id || "";
  const navigate = useNavigate();

  const defaultModel = useRef(useArticleDefaultModel()).current;
  const initialModel = getUrlModel<Articles>();

  const {
    draft: article,
    save,
    isInitiating,
    remove,
    restore,
    isPendingModification,
  } = useDraftRest<Articles>(
    "articles",
    id || "new",
    async (item) => {
      navigate(getRoute(ROUTES.ProductsView, { id: item.id }));
    },
    _.merge({}, defaultModel, initialModel) as Articles
  );

  return (
    <Page
      loading={isPendingModification}
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
            await save();
          }}
          prefix={<span>Créer un article</span>}
          onRemove={article.id ? remove : undefined}
          onRestore={article.id ? restore : undefined}
        />
      }
    >
      <div className="mt-6" />
      {isInitiating ? (
        <PageLoader />
      ) : (
        <ArticlesDetailsPage readonly={false} id={id} />
      )}
    </Page>
  );
};
