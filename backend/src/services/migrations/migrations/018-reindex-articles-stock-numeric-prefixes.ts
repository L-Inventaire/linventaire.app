import Framework from "#src/platform/index";
import Articles, {
  ArticlesDefinition,
} from "#src/services/modules/articles/entities/articles";
import StockItems, {
  StockItemsDefinition,
} from "#src/services/modules/stock/entities/stock-items";
import { expandSearchable } from "#src/services/rest/services/rest";
import { Context } from "#src/types";

export const reindexArticlesStockNumericPrefixes = async (ctx: Context) => {
  const db = await Framework.Db.getService();

  let items: Articles[] = [];
  let offset = 0;
  do {
    items = await db.select<Articles>(ctx, ArticlesDefinition.name, {}, { offset, limit: 1000, index: "id" });
    for (const entity of items) {
      await db.update<Articles>(
        ctx,
        ArticlesDefinition.name,
        { id: entity.id, client_id: entity.client_id },
        {
          searchable: expandSearchable(
            Framework.TriggersManager.getEntities()[ArticlesDefinition.name].rest.searchable(entity)
          ),
        },
        { triggers: false }
      );
    }
    offset += items.length;
  } while (items.length > 0);

  let stockItems: StockItems[] = [];
  offset = 0;
  do {
    stockItems = await db.select<StockItems>(ctx, StockItemsDefinition.name, {}, { offset, limit: 1000, index: "id" });
    for (const entity of stockItems) {
      await db.update<StockItems>(
        ctx,
        StockItemsDefinition.name,
        { id: entity.id, client_id: entity.client_id },
        {
          searchable: expandSearchable(
            Framework.TriggersManager.getEntities()[StockItemsDefinition.name].rest.searchable(entity)
          ),
        },
        { triggers: false }
      );
    }
    offset += stockItems.length;
  } while (stockItems.length > 0);
};
