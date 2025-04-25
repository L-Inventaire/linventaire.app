import * as Sentry from "@sentry/node";
import config from "config";
import { Express } from "express";
import http from "http";
import Framework from "../platform/index";
import AuthService from "./auth";
import ClientsService from "./clients";
import MigrationsService from "./migrations";
import AccountingService from "./modules/accounting";
import ArticlesService from "./modules/articles";
import CommentsService from "./modules/comments";
import ContactsService from "./modules/contacts";
import CRM from "./modules/crm";
import DataAnalysisService from "./modules/data-analysis";
import FieldsService from "./modules/fields";
import FilesService from "./modules/files";
import InvoicesService from "./modules/invoices";
import NotificationsService from "./modules/notifications";
import ServiceService from "./modules/service";
import SigningSessionService from "./modules/signing-sessions";
import StatisticsService from "./modules/statistics";
import StockService from "./modules/stock";
import TagsService from "./modules/tags";
import { createRateLimiter } from "./rate-limiter";
import RestService from "./rest";
import EventsService from "./system";
import UsersService from "./users";
import { Ctx, secureExpress, useCtx } from "./utils";

export default class Services {
  private static internalApp: Express;
  public static internalServer: http.Server;
  public static Auth: AuthService;
  public static Users: UsersService;
  public static Notifications: NotificationsService;
  public static Clients: ClientsService;
  public static Events: EventsService;
  public static Contacts: ContactsService;
  public static SignatureSessions: SigningSessionService;
  public static DataAnalysis: DataAnalysisService;
  public static Articles: ArticlesService;
  public static Invoices: InvoicesService;
  public static Stock: StockService;
  public static Service: StockService;
  public static Accounting: AccountingService;
  public static Tags: TagsService;
  public static Fields: FieldsService;
  public static Files: FilesService;
  public static Comments: CommentsService;
  public static Rest: RestService;
  public static Statistics: StatisticsService;
  public static Migrations: MigrationsService;
  public static CRM: CRM;

  static async init() {
    console.log("Initializing application services...");

    Services.internalApp = secureExpress();

    // In case of missing Content-Type, default to json
    Services.internalApp.use((req, res, next) => {
      if (!req.headers["content-type"]) {
        req.headers["content-type"] = "application/json";
      }
      next();
    });

    useCtx(Services.internalApp);

    const limiter = await createRateLimiter("none", {
      points: 50000,
      duration: 60,
    });

    Services.internalApp.use(async (req, res, next) => {
      const ctx = Ctx.get(req)?.context;
      try {
        await limiter.consume(req.ip);
        next();
      } catch (e) {
        console.error(e);
        // Save the error in the database
        Framework.LoggerDb.get("api-gateway").error(ctx, e);
        if (res)
          res.status(429).send({ error: "Too Many Requests", id: ctx.req_id });
        return;
      }
    });

    Services.Auth = await new AuthService().init(Services.internalApp);
    Services.Users = await new UsersService().init(Services.internalApp);
    Services.Notifications = await new NotificationsService().init(
      Services.internalApp
    );
    Services.Clients = await new ClientsService().init(Services.internalApp);
    Services.Contacts = await new ContactsService().init(Services.internalApp);
    Services.SignatureSessions = await new SigningSessionService().init(
      Services.internalApp
    );
    Services.Articles = await new ArticlesService().init(Services.internalApp);
    Services.Invoices = await new InvoicesService().init(Services.internalApp);
    Services.Stock = await new StockService().init(Services.internalApp);
    Services.Service = await new ServiceService().init(Services.internalApp);
    Services.Accounting = await new AccountingService().init(
      Services.internalApp
    );
    Services.Tags = await new TagsService().init(Services.internalApp);
    Services.Fields = await new FieldsService().init(Services.internalApp);
    Services.Files = await new FilesService().init(Services.internalApp);
    Services.Comments = await new CommentsService().init(Services.internalApp);
    Services.Events = await new EventsService().init(Services.internalApp);
    Services.Rest = await new RestService().init(Services.internalApp);
    Services.CRM = await new CRM().init(Services.internalApp);
    Services.Statistics = await new StatisticsService().init(
      Services.internalApp
    );
    Services.DataAnalysis = await new DataAnalysisService().init(
      Services.internalApp
    );

    // This will be done in parallel
    new MigrationsService().init(Services.internalApp);

    // Return json on 404
    Services.internalApp.use((req, res) => {
      res.status(404).json({
        error: "Not found",
      });
    });

    Sentry.setupExpressErrorHandler(Services.internalApp);

    //Return json on 500
    Services.internalApp.use((err, req, res, next) => {
      const ctx = Ctx.get(req)?.context || ({} as any);
      console.error(err);
      Framework.LoggerDb.get("api-gateway").error(ctx, err);
      res.status(err.status || 500).json({
        error: "Internal server error",
        message: err.message,
        id: ctx.req_id,
      });
    });

    const port = config.get<string>("server.port");
    const server = http.createServer(Services.internalApp);

    console.log("Initializing socket server...");

    await Framework.Socket.create(server);

    this.internalServer = server.listen(port, () => {
      console.log(`Internal server listening on port ${port}`);
    });

    console.log("Finished initializing application services...");
  }
}
