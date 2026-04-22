import { Express, Router } from "express";
import { default as Framework } from "../../../platform/index";
import { Logger } from "../../../platform/logger-db";
import { InternalApplicationService } from "../../types";
import registerRoutes from "./routes";
import { EInvoicingConfigDefinition } from "./entities/e-invoicing-config";
import { ReceivedEInvoiceDefinition } from "./entities/received-e-invoice";
import { setupCronReceivedInvoices } from "./services/received-invoices-cron";

export default class EInvoicesService implements InternalApplicationService {
  version = 1;
  name = "e-invoices";
  static logger: Logger;

  async init(server: Express) {
    const router = Router();
    registerRoutes(router);
    server.use(`/api/${this.name}/v${this.version}`, router);

    // Create database tables
    const db = await Framework.Db.getService();
    await db.createTable(EInvoicingConfigDefinition);
    await db.createTable(ReceivedEInvoiceDefinition);

    // Register entities with access control
    Framework.TriggersManager.registerEntities([EInvoicingConfigDefinition], {
      READ: "CLIENT_MANAGE",
      WRITE: "CLIENT_MANAGE",
      MANAGE: "CLIENT_MANAGE",
    });

    Framework.TriggersManager.registerEntities([ReceivedEInvoiceDefinition], {
      READ: "SUPPLIER_INVOICES_READ",
      WRITE: "SUPPLIER_INVOICES_WRITE",
      MANAGE: "SUPPLIER_INVOICES_WRITE",
    });

    EInvoicesService.logger = Framework.LoggerDb.get("e-invoices");

    // Setup cron job for fetching received invoices
    await setupCronReceivedInvoices();

    console.log(`${this.name}:v${this.version} initialized`);

    return this;
  }
}
