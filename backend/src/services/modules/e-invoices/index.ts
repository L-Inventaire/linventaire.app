import { Express, Router } from "express";
import { default as Framework } from "../../../platform/index";
import { Logger } from "../../../platform/logger-db";
import { InternalApplicationService } from "../../types";
import { Context } from "../../../types";
import registerRoutes from "./routes";
import {
  EInvoicingConfig,
  EInvoicingConfigDefinition,
} from "./entities/e-invoicing-config";
import { ReceivedEInvoiceDefinition } from "./entities/received-e-invoice";
import { setupCronReceivedInvoices } from "./services/received-invoices-cron";
import { decrypt } from "./utils/encryption";
import { SuperPDPClient } from "../../../platform/e-invoices/adapters/superpdp/client";

export default class EInvoicesService implements InternalApplicationService {
  version = 1;
  name = "e-invoices";
  static logger: Logger;

  async init(server: Express) {
    const router = Router();
    registerRoutes(router);
    server.use(`/api/${this.name}/v${this.version}`, router);

    // Create database tables
    const db = await Framework.Db.getService();
    await db.createTable(EInvoicingConfigDefinition);
    await db.createTable(ReceivedEInvoiceDefinition);

    // Register entities with access control
    Framework.TriggersManager.registerEntities([EInvoicingConfigDefinition], {
      READ: "CLIENT_MANAGE",
      WRITE: "CLIENT_MANAGE",
      MANAGE: "CLIENT_MANAGE",
    });

    Framework.TriggersManager.registerEntities([ReceivedEInvoiceDefinition], {
      READ: "SUPPLIER_INVOICES_READ",
      WRITE: "SUPPLIER_INVOICES_WRITE",
      MANAGE: "SUPPLIER_INVOICES_WRITE",
    });

    EInvoicesService.logger = Framework.LoggerDb.get("e-invoices");

    // Setup cron job for fetching received invoices
    await setupCronReceivedInvoices();

    console.log(`${this.name}:v${this.version} initialized`);

    return this;
  }

  /**
   * Get e-invoicing configuration for a client
   *
   * @param ctx - Context with client_id
   * @returns EInvoicingConfig or null if not found
   */
  async getConfig(ctx: Context): Promise<EInvoicingConfig | null> {
    const db = await Framework.Db.getService();

    const configs = await db.select<EInvoicingConfig>(
      ctx,
      EInvoicingConfigDefinition.name,
      {
        client_id: ctx.client_id,
      },
      { limit: 1 }
    );

    return configs[0] || null;
  }

  /**
   * Get a configured SuperPDP client for the given context
   * Automatically fetches configuration from DB and decrypts credentials
   *
   * @param ctx - Context with client_id
   * @returns SuperPDPClient instance
   * @throws Error if configuration not found or credentials cannot be decrypted
   */
  async getClient(ctx: Context): Promise<SuperPDPClient> {
    // Get config for this client
    const config = await this.getConfig(ctx);
    if (!config) {
      throw new Error(
        `E-invoicing configuration not found for client ${ctx.client_id}`
      );
    }

    // Decrypt credentials
    const clientSecret = decrypt(config.integration_client_secret_encrypted);
    if (!clientSecret) {
      throw new Error(
        `Failed to decrypt client secret for client ${ctx.client_id}`
      );
    }

    // Create and return SuperPDP client
    return Framework.EInvoices.getClient({
      clientId: config.integration_client_id,
      clientSecret,
    });
  }
}
