import { checkRole } from "#src/services/common";
import Services from "#src/services/index";
import { Ctx } from "#src/services/utils";
import { Express, Router } from "express";
import _ from "lodash";
import { default as Framework, default as platform } from "../../../platform";
import { Logger } from "../../../platform/logger-db";
import { InternalApplicationService } from "../../types";
import StockItems, { StockItemsDefinition } from "./entities/stock-items";
import { StockLocationsDefinition } from "./entities/stock-locations";
import { setUpsertHook } from "./triggers/upsert-hook";

export default class Stocks implements InternalApplicationService {
  version = 1;
  name = "stocks";
  static logger: Logger;

  async init(server: Express) {
    const router = Router();

    router.post("/:clientId/batch", checkRole("USER"), async (req, res) => {
      const ctx = Ctx.get(req)?.context;
      const stockItems = req.body as (StockItems & {
        _allow_duplicate_serial_number?: boolean;
      })[];

      // Group them by .for_rel_quote x .from_rel_supplier_quote so we have one single trigger for each doc
      const groupedItems: {
        [key: string]: (StockItems & {
          _allow_duplicate_serial_number?: boolean;
        })[];
      } = _.groupBy(
        stockItems,
        (item) =>
          `${item.for_rel_quote || ""}-${item.from_rel_supplier_quote || ""}`
      );

      // We'll import all without trigger except for the last one that will have a trigger
      for (const key in groupedItems) {
        const items = groupedItems[key];
        for (let i = 0; i < items.length; i++) {
          const runTrigger = i === items.length - 1;
          const item = items[i];
          ctx._batch_import_ignore_triggers = !runTrigger;

          if (
            !item._allow_duplicate_serial_number &&
            item.serial_number?.trim()
          ) {
            // Check that the serial number is not already used in stock
            const existingItem = (
              await Services.Rest.search<StockItems>(
                ctx,
                StockItemsDefinition.name,
                {
                  serial_number: item.serial_number,
                  article: item.article,
                }
              )
            )?.list?.map((a) => a.quantity > 0)[0];
            if (existingItem) {
              continue;
            }
          }

          await Services.Rest.create(ctx, StockItemsDefinition.name, item);
        }
      }

      return res.status(200).json({ ok: true });
    });

    console.log(`/api/${this.name}/v${this.version}`);

    server.use(`/api/${this.name}/v${this.version}`, router);

    const db = await platform.Db.getService();
    await db.createTable(StockItemsDefinition);
    await db.createTable(StockLocationsDefinition);

    Stocks.logger = Framework.LoggerDb.get("stocks");

    Framework.TriggersManager.registerEntities([StockItemsDefinition], {
      READ: "STOCK_READ",
      WRITE: "STOCK_WRITE",
      MANAGE: "STOCK_MANAGE",
    });

    Framework.TriggersManager.registerEntities([StockLocationsDefinition], {
      READ: "STOCK_READ",
      WRITE: "CLIENT_MANAGE",
      MANAGE: "CLIENT_MANAGE",
    });

    setUpsertHook();

    console.log(`${this.name}:v${this.version} initialized`);

    return this;
  }

  // Here will go the exported functions for other services
}
