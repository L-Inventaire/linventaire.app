import { Express, Router } from "express";
import { default as Framework, default as platform } from "../../../platform";
import { Logger } from "../../../platform/logger-db";
import { InternalApplicationService } from "../../types";
import { DataAnalysisDefinition } from "./entities/data-analysis";
import registerRoutes from "./routes";

export default class DataAnalysisService implements InternalApplicationService {
  version = 1;
  name = "data-analysis";
  private logger: Logger;

  async init(server: Express) {
    const router = Router();
    registerRoutes(router);
    server.use(`/api/${this.name}/v${this.version}`, router);

    const db = await platform.Db.getService();
    await db.createTable(DataAnalysisDefinition);

    this.logger = Framework.LoggerDb.get("data-analysis");

    Framework.TriggersManager.registerEntities([DataAnalysisDefinition], {
      READ: "DATA_ANALYSIS_READ",
      WRITE: "DATA_ANALYSIS_WRITE",
      MANAGE: "DATA_ANALYSIS_MANAGE",
    });

    console.log(`${this.name}:v${this.version} initialized`);

    return this;
  }

  // Here will go the exported functions for other services
}
