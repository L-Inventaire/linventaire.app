import { registerRestEntity } from "@features/ctrlk";
import { Articles } from "./types/types";
import { ArticlesDetailsPage } from "@views/client/modules/articles/components/article-details";
import { ROUTES } from "@features/routes";

export const ArticleDefaultModel: Partial<Articles> = {
  type: "product",
  tva: "20",
};

registerRestEntity<Articles>(
  "articles",
  (props) => <ArticlesDetailsPage readonly={false} id={props.id} />,
  (article) => <>{article.name}</>,
  ArticleDefaultModel,
  ROUTES.ProductsView
);
