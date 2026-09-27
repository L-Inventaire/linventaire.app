import { Express, Router } from "express";
import { default as Framework, default as platform } from "../../platform";
import { InternalApplicationService } from "../types";
import { ApiCallsDefinition } from "./entities/api-calls";
import { ApiKeysDefinition } from "./entities/api-keys";
import { WebhookDeliveriesDefinition } from "./entities/webhook-deliveries";
import { WebhooksDefinition } from "./entities/webhooks";
import registerRoutes from "./routes";
import { purgeOldApiCalls } from "./services/api-calls";
import {
  purgeOldDeliveries,
  setWebhooksTrigger,
  startDeliveriesWorker,
} from "./services/webhook-deliveries";

/**
 * Tools for developers: api keys (a key acts on behalf of its owner, with the same
 * permissions, restricted to one company), history of the api calls, webhooks and
 * the public API documentation.
 */
export default class Developers implements InternalApplicationService {
  version = 1;
  name = "developers";

  async init(server: Express) {
    const router = Router();
    registerRoutes(router);
    server.use(`/api/${this.name}/v${this.version}`, router);

    const db = await platform.Db.getService();
    const tables = [
      ApiKeysDefinition,
      ApiCallsDefinition,
      WebhooksDefinition,
      WebhookDeliveriesDefinition,
    ];
    for (const table of tables) {
      await db.createTable(table);
    }

    // Never expose these tables through the generic REST api
    Framework.TriggersManager.registerEntities(tables, async () => false);

    setWebhooksTrigger();
    if (!process.env.JEST) startDeliveriesWorker();

    Framework.Cron.schedule(
      this.name + "-purge-cron",
      "0 30 3 * * *", // Every day at 3:30
      async () => {
        await purgeOldApiCalls();
        await purgeOldDeliveries();
      }
    );

    console.log(`${this.name}:v${this.version} initialized`);
    return this;
  }
}
