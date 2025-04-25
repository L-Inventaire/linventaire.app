import DbService from "./db";
import LoggerDbService from "./logger-db";
import PushEMailService from "./push-email";
import CaptchaService from "./captcha";
import I18nService from "./i18n";
import SocketService from "./socket";
import RedisService from "./redis";
import AmqpService from "./amqp";
import S3Service from "./s3";
import CronService from "./cron";
import LockService from "./lock";
import AnalyticsService from "./analytics";
import PushTextMessageService from "./push-text-message";
import TriggersManagerService from "./triggers-manager";

export default class Framework {
  public static Db: DbService;
  public static LoggerDb: LoggerDbService;
  public static PushTextMessage: PushTextMessageService;
  public static PushEMail: PushEMailService;
  public static Captcha: CaptchaService;
  public static I18n: I18nService;
  public static Socket: SocketService;
  public static Redis: RedisService;
  public static Amqp: AmqpService;
  public static S3: S3Service;
  public static Cron: typeof CronService;
  public static Lock: LockService;
  public static Analytics: AnalyticsService;
  public static TriggersManager: TriggersManagerService;

  static async init() {
    console.log("Initializing platform services...");

    Framework.LoggerDb = await new LoggerDbService().init();
    Framework.Db = await new DbService().init();
    Framework.PushEMail = await new PushEMailService().init();
    Framework.PushTextMessage = await new PushTextMessageService().init();
    Framework.Captcha = await new CaptchaService().init();
    Framework.I18n = await new I18nService().init();
    Framework.Redis = await new RedisService().init();
    Framework.Socket = await new SocketService().init();
    Framework.Amqp = await new AmqpService().init();
    Framework.S3 = await new S3Service().init();
    Framework.Cron = CronService;
    Framework.Lock = await new LockService().init(Framework.Redis);
    Framework.Analytics = await new AnalyticsService().init();
    Framework.TriggersManager = await new TriggersManagerService(
      Framework.Socket
    ).init();

    console.log("Finished initializing platform services...");
  }
}
