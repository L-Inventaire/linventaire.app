import { Button } from "@atoms/button/button";
import { TagsInput } from "@components/input-rest/tags";
import { registerCtrlKRestEntity } from "@features/ctrlk";
import { ROUTES } from "@features/routes";
import { formatAmount } from "@features/utils/format/strings";
import { ArticlesDetailsPage } from "@views/client/modules/articles/components/article-details";
import { Articles } from "./types/types";
import { getTvaValue } from "@views/client/modules/invoices/utils";
import { getArticleIcon } from "@views/client/modules/articles/components/article-icon";
import { Base, Info } from "@atoms/text";

export const useArticleDefaultModel: () => Partial<Articles> = () => ({
  type: "product",
  tva: "20",
});

registerCtrlKRestEntity<Articles>("articles", {
  renderEditor: (props) => (
    <ArticlesDetailsPage readonly={false} id={props.id} />
  ),
  renderResult: [
    {
      title: "Type",
      thClassName: "w-1",
      cellClassName: "justify-start",
      render: (article) => (
        <Button size="sm" theme="outlined" icon={getArticleIcon(article?.type)}>
          {article.type === "consumable" && "Consommable"}
          {article.type === "service" && "Service"}
          {article.type === "product" && "Stockable"}
        </Button>
      ),
    },
    {
      title: "Nom",
      render: (article) => (
        <>
          {!!article.internal_reference && (
            <span className="font-mono mr-2 text-slate-800 dark:text-slate-500">
              {article.internal_reference}
            </span>
          )}
          {article.name}
        </>
      ),
    },
    {
      title: "Étiquettes",
      thClassName: "w-1",
      render: (article) => (
        <div className="w-full flex space-x-1 items-center whitespace-nowrap">
          <TagsInput size="md" value={article.tags} disabled />
        </div>
      ),
    },
    {
      title: "Prix d'achat",
      thClassName: "w-1",
      cellClassName: "justify-end",
      headClassName: "justify-end",
      render: (article) =>
        Object.values(article.suppliers_details || {})?.filter((a) => a.price)
          ?.length ? (
          <Base className="whitespace-nowrap text-right">
            {Object.values(article.suppliers_details || {})
              .filter((a) => a.price)
              .map((a) =>
                formatAmount(a.price * (1 + getTvaValue(article.tva)))
              )
              // Keep only min and max
              .sort()
              .filter((_, i, arr) => i === 0 || i === arr.length - 1)
              .join("-")}
            <br />
            <Info>
              {Object.values(article.suppliers_details || {})
                .filter((a) => a.price)
                .map((a) => formatAmount(a.price))
                // Keep only min and max
                .sort()
                .filter((_, i, arr) => i === 0 || i === arr.length - 1)
                .join("-")}{" "}
              HT
            </Info>
          </Base>
        ) : (
          ""
        ),
    },
    {
      title: "Prix de vente",
      thClassName: "w-1",
      cellClassName: "justify-end",
      headClassName: "justify-end",
      render: (article) => (
        <Base className="whitespace-nowrap text-right">
          {formatAmount(article.price * (1 + getTvaValue(article.tva)))}
          <br />
          <Info>{formatAmount(article.price)} HT</Info>
        </Base>
      ),
    },
  ],
  useDefaultData: useArticleDefaultModel,
  viewRoute: ROUTES.ProductsView,
});
