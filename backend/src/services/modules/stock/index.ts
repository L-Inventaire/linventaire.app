import { Express, Router } from "express";
import { default as Framework, default as platform } from "../../../platform";
import { Logger } from "../../../platform/logger-db";
import { InternalApplicationService } from "../../types";
import { StockItemsDefinition } from "./entities/stock-items";
import { StockLocationsDefinition } from "./entities/stock-locations";
import { setUpsertHook } from "./triggers/upsert-hook";

export default class Stocks implements InternalApplicationService {
  version = 1;
  name = "stocks";
  static logger: Logger;

  async init(server: Express) {
    const router = Router();
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
