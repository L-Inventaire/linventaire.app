import Framework from "#src/platform/index";
import StockItems, {
  StockItemsDefinition,
} from "#src/services/modules/stock/entities/stock-items";
import { expandSearchable } from "#src/services/rest/services/rest";
import { Context } from "#src/types";

export const rebuildStockSearchables = async (ctx: Context) => {
  // For all stock items
  const db = await Framework.Db.getService();
  let stockItems = [];
  let offset = 0;
  do {
    stockItems = await db.select<StockItems>(
      ctx,
      StockItemsDefinition.name,
      {},
      {
        offset,
        limit: 1000,
        index: "id",
      }
    );

    for (const entity of stockItems) {
      entity.searchable = expandSearchable(
        Framework.TriggersManager.getEntities()[
          StockItemsDefinition.name
        ].rest.searchable(entity)
      );
      await db.update<StockItems>(
        ctx,
        StockItemsDefinition.name,
        { id: entity.id, client_id: entity.client_id },
        {
          searchable: entity.search,
        },
        { triggers: false }
      );
    }

    offset += stockItems.length;
  } while (stockItems.length > 0);
};
