import { Express, Router } from "express";
import { default as Framework } from "../../../platform/index";
import { Logger } from "../../../platform/logger-db";
import { InternalApplicationService } from "../../types";
import registerRoutes from "./routes";
import { EInvoicingConfigDefinition } from "./entities/e-invoicing-config";

export default class EInvoicesService implements InternalApplicationService {
  version = 1;
  name = "e-invoices";
  static logger: Logger;

  async init(server: Express) {
    const router = Router();
    registerRoutes(router);
    server.use(`/api/${this.name}/v${this.version}`, router);

    // Create database table
    const db = await Framework.Db.getService();
    await db.createTable(EInvoicingConfigDefinition);

    // Register entity with access control
    Framework.TriggersManager.registerEntities([EInvoicingConfigDefinition], {
      READ: "CLIENT_MANAGE",
      WRITE: "CLIENT_MANAGE",
      MANAGE: "CLIENT_MANAGE",
    });

    EInvoicesService.logger = Framework.LoggerDb.get("e-invoices");

    console.log(`${this.name}:v${this.version} initialized`);

    return this;
  }
}
