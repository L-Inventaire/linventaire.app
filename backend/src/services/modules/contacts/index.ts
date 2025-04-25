import { Express, Router } from "express";
import { default as Framework, default as platform } from "../../../platform";
import { Logger } from "../../../platform/logger-db";
import { InternalApplicationService } from "../../types";
import { ContactsDefinition } from "./entities/contacts";
import registerRoutes from "./routes";
import { setupOnContactRelationsChanged } from "./services/update-relations";

export default class Contacts implements InternalApplicationService {
  version = 1;
  name = "contacts";
  static logger: Logger;

  async init(server: Express) {
    const router = Router();
    registerRoutes(router);
    server.use(`/api/${this.name}/v${this.version}`, router);

    const db = await platform.Db.getService();
    await db.createTable(ContactsDefinition);

    Contacts.logger = Framework.LoggerDb.get("contacts");

    setupOnContactRelationsChanged();

    Framework.TriggersManager.registerEntities([ContactsDefinition], {
      READ: "CONTACTS_READ",
      WRITE: "CONTACTS_WRITE",
      MANAGE: "CONTACTS_MANAGE",
    });

    console.log(`${this.name}:v${this.version} initialized`);

    return this;
  }

  // Here will go the exported functions for other services
}
