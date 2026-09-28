import { Express, Router } from "express";
import { InternalApplicationService } from "../types";
import registerRoutes from "./routes";

/**
 * Platform administration (all the companies and their activity),
 * reserved to users with the SYSADMIN role.
 */
export default class Admin implements InternalApplicationService {
  version = 1;
  name = "admin";

  async init(server: Express) {
    const router = Router();
    registerRoutes(router);
    server.use(`/api/${this.name}/v${this.version}`, router);

    console.log(`${this.name}:v${this.version} initialized`);
    return this;
  }
}
