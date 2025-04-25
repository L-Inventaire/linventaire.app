import { Express, Router } from "express";
import { default as Framework, default as platform } from "../../../platform";
import { Logger } from "../../../platform/logger-db";
import { InternalApplicationService } from "../../types";
import { ArticlesDefinition } from "./entities/articles";
import { setCopyTagsToInvoices } from "./triggers/copy-tags-to-invoices";

export default class Articles implements InternalApplicationService {
  version = 1;
  name = "articles";
  static logger: Logger;

  async init(server: Express) {
    const router = Router();
    server.use(`/api/${this.name}/v${this.version}`, router);

    const db = await platform.Db.getService();
    await db.createTable(ArticlesDefinition);

    Articles.logger = Framework.LoggerDb.get("articles");

    Framework.TriggersManager.registerEntities([ArticlesDefinition], {
      READ: "ARTICLES_READ",
      WRITE: "ARTICLES_WRITE",
      MANAGE: "ARTICLES_MANAGE",
    });

    setCopyTagsToInvoices();

    console.log(`${this.name}:v${this.version} initialized`);

    return this;
  }

  // Here will go the exported functions for other services
}
