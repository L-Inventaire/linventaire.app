import _ from "lodash";
import Framework from "../../../../platform";
import Articles, { ArticlesDefinition } from "../../articles/entities/articles";
import StockItems, { StockItemsDefinition } from "../entities/stock-items";
import { getArticleReferences } from "./upsert-hook";

/** Keep the article name and references cached in stock items up to date, they are used for search **/
export const setOnArticleChanged = () =>
  Framework.TriggersManager.registerTrigger<Articles>(ArticlesDefinition, {
    test: (_ctx, entity, oldEntity) =>
      !!entity &&
      !!oldEntity &&
      (entity.name !== oldEntity.name ||
        getArticleReferences(entity) !== getArticleReferences(oldEntity)),
    callback: async (ctx, entity) => {
      if (!entity) return;
      const db = await Framework.Db.getService();

      const articleName = entity.name;
      const articleReferences = getArticleReferences(entity);

      let stockItems: StockItems[] = [];
      let offset = 0;
      do {
        stockItems = await db.select<StockItems>(
          ctx,
          StockItemsDefinition.name,
          { client_id: entity.client_id, article: entity.id },
          { offset, limit: 1000, index: "id" }
        );

        for (const item of stockItems) {
          if (
            item.cache?.article_name === articleName &&
            item.cache?.article_references === articleReferences
          )
            continue;

          // Searchable is recomputed from the updated cache by the db prehook
          await db.update<StockItems>(
            ctx,
            StockItemsDefinition.name,
            { client_id: item.client_id, id: item.id },
            {
              cache: {
                ..._.cloneDeep(item.cache),
                article_name: articleName,
                article_references: articleReferences,
              },
            },
            { triggers: false }
          );
        }

        offset += stockItems.length;
      } while (stockItems.length > 0);
    },
    name: "on-article-changed-update-stock-items",
  });
