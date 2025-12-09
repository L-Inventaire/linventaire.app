import { Express, Router } from "express";
import { default as Framework } from "../../../platform/index";
import { Logger } from "../../../platform/logger-db";
import { InternalApplicationService } from "../../types";
import registerRoutes from "./routes";

export default class DataExportService implements InternalApplicationService {
  version = 1;
  name = "data-export";
  static logger: Logger;

  async init(server: Express) {
    const router = Router();
    registerRoutes(router);
    server.use(`/api/${this.name}/v${this.version}`, router);

    DataExportService.logger = Framework.LoggerDb.get("data-export");

    console.log(`${this.name}:v${this.version} initialized`);

    return this;
  }
}
