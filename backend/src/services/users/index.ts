import { Express, Router } from "express";
import { default as Framework, default as platform } from "../../platform";
import { Logger } from "../../platform/logger-db";
import { Context } from "../../types";
import { InternalApplicationService } from "../types";
import { UsersDefinition } from "./entities/users";
import registerRoutes from "./routes";
import { getUser, setAvatar } from "./services/system";
import { getPublicUser } from "./services/user";

export default class Users implements InternalApplicationService {
  version = 1;
  name = "users";
  private logger: Logger;

  async init(server: Express) {
    const router = Router();
    registerRoutes(router);
    server.use(`/api/${this.name}/v${this.version}`, router);

    const db = await platform.Db.getService();
    await db.createTable(UsersDefinition);

    this.logger = Framework.LoggerDb.get("users");

    console.log(`${this.name}:v${this.version} initialized`);
    return this;
  }

  async getUser(
    ctx: Context,
    query: {
      id?: string;
      email?: string;
      phone?: string;
    }
  ) {
    this.logger.info(ctx, "get");
    return await getUser(
      ctx,
      query.id as string,
      query.email as string,
      query.phone as string
    );
  }

  async getPublicUser(
    ctx: Context,
    query: {
      id?: string;
      email?: string;
      phone?: string;
    }
  ) {
    this.logger.info(ctx, "get-public");
    return await getPublicUser(
      ctx,
      query.id as string,
      query.email as string,
      query.phone as string
    );
  }

  async setUserAvatar(ctx: Context, id: string, avatar: string) {
    this.logger.info(ctx, "set-avatar");
    return await setAvatar(ctx, id, avatar);
  }
}
