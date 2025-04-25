import { Express, Router } from "express";
import { InternalApplicationService } from "../types";
import registerRoutes from "./routes";

export default class Auth implements InternalApplicationService {
  version = 1;
  name = "auth";

  async init(server: Express) {
    const router = Router();
    registerRoutes(router);
    server.use(`/api/${this.name}/v${this.version}`, router);

    console.log(`${this.name}:v${this.version} initialized`);
    return this;
  }
}
