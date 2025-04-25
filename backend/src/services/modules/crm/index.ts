import { Express, Router } from "express";
import platform, { default as Framework } from "../../../platform";
import { Logger } from "../../../platform/logger-db";
import { InternalApplicationService } from "../../types";
import { CRMItemsDefinition } from "./entities/crm-items";
import { setOnUpdateClientCRM } from "./triggers/on-update-client";

export default class CRM implements InternalApplicationService {
  version = 1;
  name = "crm";
  static logger: Logger;

  async init(server: Express) {
    const router = Router();
    server.use(`/api/${this.name}/v${this.version}`, router);

    const db = await platform.Db.getService();
    await db.createTable(CRMItemsDefinition);

    CRM.logger = Framework.LoggerDb.get("crm");

    Framework.TriggersManager.registerEntities([CRMItemsDefinition], {
      READ: "CRM_READ",
      WRITE: "CRM_WRITE",
      MANAGE: "CRM_MANAGE",
    });

    setOnUpdateClientCRM();

    console.log(`${this.name}:v${this.version} initialized`);

    return this;
  }

  // Here will go the exported functions for other services
}
