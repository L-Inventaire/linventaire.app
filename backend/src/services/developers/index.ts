import { Express, Router } from "express";
import { default as Framework, default as platform } from "../../platform";
import { InternalApplicationService } from "../types";
import { ApiKeysDefinition } from "./entities/api-keys";
import registerRoutes from "./routes";

/**
 * Tools for developers: api keys (a key acts on behalf of its owner, with the same
 * permissions, restricted to one company) and the public API documentation.
 */
export default class Developers implements InternalApplicationService {
  version = 1;
  name = "developers";

  async init(server: Express) {
    const router = Router();
    registerRoutes(router);
    server.use(`/api/${this.name}/v${this.version}`, router);

    const db = await platform.Db.getService();
    await db.createTable(ApiKeysDefinition);

    // Never expose api keys through the generic REST api
    Framework.TriggersManager.registerEntities(
      [ApiKeysDefinition],
      async () => false
    );

    console.log(`${this.name}:v${this.version} initialized`);
    return this;
  }
}
