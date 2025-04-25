import { Express, Router } from "express";
import platform, { default as Framework } from "../../../platform";
import { Logger } from "../../../platform/logger-db";
import { InternalApplicationService } from "../../types";
import { AccountingAccountsDefinition } from "./entities/accounts";
import { AccountingTransactionsDefinition } from "./entities/transactions";
import { setOnContactCreateDefaultTrigger } from "./triggers/on-contact-create-default";

export default class Accounting implements InternalApplicationService {
  version = 1;
  name = "stocks";
  static logger: Logger;

  async init(server: Express) {
    const router = Router();
    server.use(`/api/${this.name}/v${this.version}`, router);

    const db = await platform.Db.getService();
    await db.createTable(AccountingTransactionsDefinition);
    await db.createTable(AccountingAccountsDefinition);

    Accounting.logger = Framework.LoggerDb.get("stocks");

    Framework.TriggersManager.registerEntities(
      [AccountingTransactionsDefinition],
      {
        READ: "ACCOUNTING_READ",
        WRITE: "ACCOUNTING_WRITE",
        MANAGE: "ACCOUNTING_MANAGE",
      }
    );

    Framework.TriggersManager.registerEntities([AccountingAccountsDefinition], {
      READ: "ACCOUNTING_READ",
      WRITE: "CLIENT_MANAGE",
      MANAGE: "CLIENT_MANAGE",
    });

    setOnContactCreateDefaultTrigger();

    console.log(`${this.name}:v${this.version} initialized`);

    return this;
  }

  // Here will go the exported functions for other services
}
