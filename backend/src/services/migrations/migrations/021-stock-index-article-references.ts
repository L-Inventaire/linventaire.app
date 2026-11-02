import Framework from "#src/platform/index";
import Articles, {
  ArticlesDefinition,
} from "#src/services/modules/articles/entities/articles";
import StockItems, {
  StockItemsDefinition,
} from "#src/services/modules/stock/entities/stock-items";
import { getArticleReferences } from "#src/services/modules/stock/triggers/upsert-hook";
import { Context } from "#src/types";

// Cache the article references in stock items so they can be searched by them
export const indexStockArticleReferences = async (ctx: Context) => {
  const db = await Framework.Db.getService();
  const articles = new Map<string, Articles | null>();

  let stockItems: StockItems[] = [];
  let offset = 0;
  do {
    stockItems = await db.select<StockItems>(
      ctx,
      StockItemsDefinition.name,
      {},
      { offset, limit: 1000, index: "id" }
    );

    for (const entity of stockItems) {
      if (!entity.article) continue;

      const key = entity.client_id + "/" + entity.article;
      if (!articles.has(key)) {
        articles.set(
          key,
          await db.selectOne<Articles>(ctx, ArticlesDefinition.name, {
            client_id: entity.client_id,
            id: entity.article,
          })
        );
      }
      const article = articles.get(key);

      // Searchable is recomputed from the updated cache by the db prehook
      await db.update<StockItems>(
        ctx,
        StockItemsDefinition.name,
        { client_id: entity.client_id, id: entity.id },
        {
          cache: {
            ...entity.cache,
            article_name: article?.name || entity.cache?.article_name || "",
            article_references: getArticleReferences(article),
          },
        },
        { triggers: false }
      );
    }

    console.log(
      `[migrations] Stock items article references... offset=${offset} length=${stockItems.length}`
    );

    offset += stockItems.length;
  } while (stockItems.length > 0);
};
