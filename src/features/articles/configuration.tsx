import { registerCtrlKRestEntity } from "@features/ctrlk";
import { Articles } from "./types/types";
import { ArticlesDetailsPage } from "@views/client/modules/articles/components/article-details";
import { ROUTES } from "@features/routes";

export const useArticleDefaultModel: () => Partial<Articles> = () => ({
  type: "product",
  tva: "20",
});

registerCtrlKRestEntity<Articles>("articles", {
  renderEditor: (props) => (
    <ArticlesDetailsPage readonly={false} id={props.id} />
  ),
  renderResult: (article) => <>{article.name}</>,
  useDefaultData: useArticleDefaultModel,
  viewRoute: ROUTES.ProductsView,
});
