import Framework from "#src/platform/index";
import { Context, createContext } from "#src/types";
import _ from "lodash";
import Articles, { ArticlesDefinition } from "../../articles/entities/articles";
import Invoices from "../entities/invoices";

export const getInvoicesByArticle = async (ctx: Context, articleId: string) => {
  const db = await Framework.Db.getService();
  const result = await db.custom<any>(
    ctx,
    `
      SELECT * 
        FROM invoices 
        WHERE $1 IN (SELECT jsonb_array_elements_text(articles->'all')) 
        AND is_deleted = false;
    `,
    [articleId]
  );

  return result?.rows ?? [];
};

// TODO: This an optimized version of the setCopyTagsToInvoices trigger, but it's not working yet.
// The computed_tags are based on the tags of the articles linked to the invoice, but the value of articles.tags is N-1 old and we don't know why
// (maybe the custom request is too complex to be executed in the same transaction as other triggers).
export const setComputedArticleTagsByArticle = async (
  _: Context,
  articleId: string
) => {
  const db = await Framework.Db.getService();

  const updateRequest = `
      UPDATE invoices
      SET articles = jsonb_set(
          articles,
          '{computed_tags}',
          (
            SELECT jsonb_agg(DISTINCT tags)
            FROM articles
            WHERE articles.id = ANY (SELECT jsonb_array_elements_text(invoices.articles->'all'))
          )
      )
      WHERE invoices.articles->'all' @> to_jsonb(array[$1])::jsonb;
    `;

  // const selectRequest = `
  //     SELECT articles->>'all' as all_articles,
  //       (
  //         SELECT jsonb_agg(DISTINCT tags)
  //         FROM articles
  //         WHERE articles.id = ANY (SELECT jsonb_array_elements_text(invoices.articles->'all'))
  //       ) as computed_tags
  //       FROM invoices
  //       WHERE invoices.articles->'all' @> to_jsonb(array[ $1 ])::jsonb;
  //   `;

  const result = await db.custom<any>(
    createContext("cron", "SYSTEM"),
    updateRequest,
    [articleId]
  );

  return result?.rows ?? [];
};

export const setArticlesTagsToInvoices = async (
  ctx: Context,
  invoice: Invoices
) => {
  if (!invoice?.articles?.all) return invoice;

  const db = await Framework.Db.getService();
  const articles = await db.select<Articles>(ctx, ArticlesDefinition.name, {
    id: invoice?.articles?.all,
  });

  const tags = articles.flatMap((a) => a.tags);
  invoice.articles.computed_tags = _.uniq(tags);

  return invoice;
};
