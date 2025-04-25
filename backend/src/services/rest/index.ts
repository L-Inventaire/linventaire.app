import { Express, Router } from "express";
import { default as Framework } from "../../platform";
import { Logger } from "../../platform/logger-db";
import { InternalApplicationService } from "../types";
import { RestEntity } from "./entities/entity";
import registerRoutes from "./routes";
import { searchHistory, setupHistoryTrigger } from "./services/history";
import { create, search, update } from "./services/rest";

/**
 * This service exposes a set of tables for a common way to update any object in the database.
 * It supports insert, update, delete, get and search.
 */
export default class Rest implements InternalApplicationService {
  version = 1;
  name = "rest";
  private logger: Logger;

  async init(server: Express) {
    const router = Router();
    registerRoutes(router);
    server.use(`/api/${this.name}/v${this.version}`, router);

    this.logger = Framework.LoggerDb.get("rest");

    setupHistoryTrigger();

    console.log(`${this.name}:v${this.version} initialized`);
    return this;
  }

  async registerCommentId(ctx: any, table: string, id: string) {
    const driver = await Framework.Db.getService();
    await driver.update<RestEntity>(ctx, table, { id }, { comment_id: id });
  }

  search = search;
  create = create;
  update = update;
  searchHistory = searchHistory;
}
