import { Express, Router } from "express";
import { default as Framework, default as platform } from "../../platform";
import { Logger } from "../../platform/logger-db";
import { InternalApplicationService } from "../types";
import { EventsDefinition } from "./entities/events";
import registerRoutes from "./routes";
import { TasksDefinition } from "./entities/tasks";

export default class Events implements InternalApplicationService {
  version = 1;
  name = "system";
  private logger: Logger;

  async init(server: Express) {
    const router = Router();
    registerRoutes(router);
    server.use(`/api/${this.name}/v${this.version}`, router);

    const db = await platform.Db.getService();
    await db.createTable(EventsDefinition);
    await db.createTable(TasksDefinition);

    this.logger = Framework.LoggerDb.get("system");

    console.log(`${this.name}:v${this.version} initialized`);
    return this;
  }
}
