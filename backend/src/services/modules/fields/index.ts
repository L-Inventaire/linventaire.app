import { Express, Router } from "express";
import { default as Framework, default as platform } from "../../../platform";
import { Logger } from "../../../platform/logger-db";
import { InternalApplicationService } from "../../types";
import { FieldsDefinition } from "./entities/fields";

export default class Fields implements InternalApplicationService {
  version = 1;
  name = "fields";
  private logger: Logger;

  async init(server: Express) {
    const router = Router();
    server.use(`/api/${this.name}/v${this.version}`, router);

    const db = await platform.Db.getService();
    await db.createTable(FieldsDefinition);

    this.logger = Framework.LoggerDb.get("fields");

    Framework.TriggersManager.registerEntities([FieldsDefinition], {
      READ: "FIELDS_READ",
      WRITE: "FIELDS_WRITE",
      MANAGE: "FIELDS_MANAGE",
    });

    console.log(`${this.name}:v${this.version} initialized`);

    return this;
  }

  // Here will go the exported functions for other services
}
