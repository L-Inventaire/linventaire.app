import { Express, Router } from "express";
import { default as Framework, default as platform } from "../../platform";
import { Logger } from "../../platform/logger-db";
import { Context } from "../../types";
import { InternalApplicationService } from "../types";
import ClientsType, { ClientsDefinition } from "./entities/clients";
import { ClientsUsersDefinition, Role } from "./entities/clients-users";
import registerRoutes from "./routes";
import { checkRoles, getClients } from "./services/client-roles";
import { getUsers } from "./services/client-users";
import { setOnFormatChanged } from "./triggers/on-format-changed";
import { getInvoiceCounters } from "./services/client";

export default class Clients implements InternalApplicationService {
  version = 1;
  name = "clients";
  private logger: Logger;

  async init(server: Express) {
    const router = Router();
    registerRoutes(router);
    server.use(`/api/${this.name}/v${this.version}`, router);

    const db = await platform.Db.getService();
    await db.createTable(ClientsDefinition);
    await db.createTable(ClientsUsersDefinition);

    this.logger = Framework.LoggerDb.get("clients");

    setOnFormatChanged();

    console.log(`${this.name}:v${this.version} initialized`);
    return this;
  }

  async getClient(ctx: Context, id: string) {
    this.logger.info(ctx, "get-client", { id });
    const db = await platform.Db.getService();
    return await db.selectOne<ClientsType>(ctx, ClientsDefinition.name, { id });
  }

  async getUserClients(ctx: Context, id?: string) {
    this.logger.info(ctx, "get-user-clients");
    return await getClients(ctx, id);
  }

  async getClientUsers(ctx: Context, id?: string) {
    this.logger.info(ctx, "get-users");
    return await getUsers(ctx, id);
  }

  async checkUserRoles(ctx: Context, clientId: string, roles: Role[]) {
    this.logger.info(ctx, "check-roles", { clientId, roles });
    return await checkRoles(ctx, clientId, roles);
  }

  async getInvoicesCounters(
    ctx: Context,
    clientId: string,
    date?: Date | string | number
  ): Promise<{ counters: ClientsType["invoices_counters"]; timezone: string }> {
    this.logger.info(ctx, "get-invoices-counters", { clientId });
    const db = await platform.Db.getService();
    const counters = await db.selectOne<ClientsType>(
      ctx,
      ClientsDefinition.name,
      { id: clientId }
    );
    return {
      counters: getInvoiceCounters(counters.invoices_counters, date),
      timezone: counters.preferences?.timezone || "Europe/Paris",
    };
  }

  async updateInvoicesCounters(
    ctx: Context,
    clientId: string,
    counters: ClientsType["invoices_counters"]
  ) {
    this.logger.info(ctx, "set-invoices-counters", { clientId });
    const db = await platform.Db.getService();
    await db.update<ClientsType>(
      ctx,
      ClientsDefinition.name,
      { id: clientId },
      { invoices_counters: counters }
    );
  }
}
