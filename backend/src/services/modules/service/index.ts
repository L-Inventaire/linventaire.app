import { Express, Router } from "express";
import { default as Framework, default as platform } from "../../../platform";
import { Logger } from "../../../platform/logger-db";
import { InternalApplicationService } from "../../types";
import { ServiceItemsDefinition } from "./entities/service-item";
import { ServiceTimesDefinition } from "./entities/service-time";
import { setTimeToFillServiceTrigger } from "./triggers/set-time-to-fill-service";
import { setUpsertHook } from "./triggers/upsert-hook";

export default class Services implements InternalApplicationService {
  version = 1;
  name = "services";
  static logger: Logger;

  async init(server: Express) {
    const router = Router();
    server.use(`/api/${this.name}/v${this.version}`, router);

    const db = await platform.Db.getService();
    await db.createTable(ServiceItemsDefinition);
    await db.createTable(ServiceTimesDefinition);

    Services.logger = Framework.LoggerDb.get("services");

    Framework.TriggersManager.registerEntities([ServiceItemsDefinition], {
      READ: "ONSITE_SERVICES_READ",
      WRITE: "ONSITE_SERVICES_WRITE",
      MANAGE: "ONSITE_SERVICES_MANAGE",
    });

    Framework.TriggersManager.registerEntities([ServiceTimesDefinition], {
      READ: "ONSITE_SERVICES_READ",
      WRITE: "ONSITE_SERVICES_WRITE",
      MANAGE: "ONSITE_SERVICES_MANAGE",
    });

    setTimeToFillServiceTrigger();
    setUpsertHook();

    console.log(`${this.name}:v${this.version} initialized`);

    return this;
  }

  // Here will go the exported functions for other services
}
