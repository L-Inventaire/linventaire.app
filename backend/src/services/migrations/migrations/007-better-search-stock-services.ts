import Framework from "#src/platform/index";
import ServiceItems, {
  ServiceItemsDefinition,
} from "#src/services/modules/service/entities/service-item";
import { updateCache as updateCacheService } from "#src/services/modules/service/triggers/upsert-hook";
import StockItems, {
  StockItemsDefinition,
} from "#src/services/modules/stock/entities/stock-items";
import { updateCache as updateCacheStock } from "#src/services/modules/stock/triggers/upsert-hook";
import { expandSearchable } from "#src/services/rest/services/rest";
import { Context } from "#src/types";
import _ from "lodash";

export const betterSearchStockServices = async (ctx: Context) => {
  // For all service items
  const db = await Framework.Db.getService();
  let services: ServiceItems[] = [];
  let offset = 0;
  do {
    services = await db.select<ServiceItems>(
      ctx,
      ServiceItemsDefinition.name,
      {},
      {
        offset,
        limit: 1000,
        index: "id",
      }
    );

    for (const entity of services) {
      entity.cache = await updateCacheService(ctx, entity, null, true);
      entity.searchable = expandSearchable(
        entity.searchable + " " + Object.values(entity.cache).join(" ")
      );
      await db.update<ServiceItems>(
        ctx,
        ServiceItemsDefinition.name,
        { client_id: entity.client_id, id: entity.id },
        _.pick(entity, ["searchable", "cache"]),
        { triggers: false }
      );
    }

    console.log(
      `[migrations] Services items... offset=${offset} length=${services.length}`
    );

    offset += services.length;
  } while (services.length > 0);

  console.log("[migrations] Updated searchable for service items");

  let stock: StockItems[] = [];
  offset = 0;
  do {
    stock = await db.select<StockItems>(
      ctx,
      StockItemsDefinition.name,
      {},
      {
        offset,
        limit: 1000,
        index: "id",
      }
    );

    for (const entity of stock) {
      entity.cache = await updateCacheStock(ctx, entity, null, true);
      entity.searchable = expandSearchable(
        entity.searchable + " " + Object.values(entity.cache).join(" ")
      );
      await db.update<StockItems>(
        ctx,
        StockItemsDefinition.name,
        { client_id: entity.client_id, id: entity.id },
        _.pick(entity, ["searchable", "cache"]),
        { triggers: false }
      );
    }

    console.log(
      `[migrations] Stock items... offset=${offset} length=${stock.length}`
    );

    offset += stock.length;
  } while (stock.length > 0);

  console.log("[migrations] Updated searchable for stock items");
};
