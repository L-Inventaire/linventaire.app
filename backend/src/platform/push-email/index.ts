import config from "config";
import platform from "..";
import { Context as Context } from "../../types";
import { PlatformService } from "../types";
import PushEMailFile from "./adapters/file";
import PushEMailSES from "./adapters/ses";
import { PushEMailInterfaceAdapterInterface, SmtpOptions } from "./api";
import { buildHTML } from "./build-email";
import Framework from "..";
import PushEMailSmtp from "./adapters/smtp";
import { captureException } from "@sentry/node";

export type EmailAttachment = {
  filename: string;
  content: Buffer;
};

const demoEmailWhitelist = [
  /^.*@linventaire.app$/,
  /^.*@proxima.fr$/,
  /^romaric.(mollard|mourgues)@gmail.com$/,
  /^ukhanov.ilya.67@gmail.com$/,
  /^ilya@linventaire.app$/,
];

export default class PushEMail implements PlatformService {
  private service: PushEMailInterfaceAdapterInterface;
  private smtpService: PushEMailInterfaceAdapterInterface;

  async init() {
    this.smtpService = await new PushEMailSmtp().init();
    if (config.get<string>("email.type") === "ses") {
      console.log("PushEmail: Using SES");
      this.service = await new PushEMailSES().init();
    } else {
      console.log("PushEmail: Using File");
      this.service = await new PushEMailFile().init();
    }
    return this;
  }

  async push(
    context: Context,
    email: string,
    message: string,
    options: {
      logo?: string;
      from?: string;
      subject?: string;
      receipt?: [string, string][];
      post_receipt?: string;
      attachments?: EmailAttachment[];
    } = {},
    smtp?: SmtpOptions
  ) {
    const language = platform.I18n.getLanguage(context);
    options.subject = options.subject || "New notification from L'Inventaire";
    let built = { html: "", text: "" };
    try {
      built = await buildHTML({
        title: options.subject,
        body: message,
        logo: options?.logo,
        language: language,
        receipt: options.receipt,
        post_receipt: options.post_receipt,
        footer: platform.I18n.t(context, "emails.all.footer"),
      });
    } catch (e) {
      platform.LoggerDb.get("push-email").error(context, e);
      captureException(e);
      return;
    }

    // Demo whitelisting system
    const useWhitelisting = config.get("server.domain").includes("demo");
    const toWhitelisted = [email].filter((to) =>
      demoEmailWhitelist.some((a) => to.match(a))
    );
    const to = !useWhitelisting
      ? [email]
      : toWhitelisted.length > 0
      ? toWhitelisted
      : [
          "romaric.mollard+forsomeoneelse@gmail.com",
          "dimitri@proxima.fr",
          "ukhanov.ilya.67@gmail.com",
          "ilya@linventaire.app",
        ];

    let subject =
      options.subject + Framework.I18n.t(context, "emails.all.subject_suffix");
    subject = !useWhitelisting
      ? subject
      : (toWhitelisted.length === 0 ? "[" + to.join(", ") + "] " : "") +
        subject;

    try {
      const body = {
        to,
        message: {
          html: built.html,
          text: built.text,
          subject,
        },
        from: `${
          options?.from ? options?.from : config.get<string>("email.from_name")
        } <${config.get<string>("email.from")}>`,
        attachments: options.attachments,
      };
      if (smtp?.enabled) {
        try {
          await this.smtpService.push(body, smtp);
        } catch (e) {
          captureException(e);
          platform.LoggerDb.get("push-email").error(context, e);
          platform.LoggerDb.get("push-email").info(
            context,
            "Falling back to SES"
          );
          await this.service.push(body);
        }
      } else {
        await this.service.push(body);
      }
    } catch (err) {
      platform.LoggerDb.get("push-email").error(context, err);
    }
  }
}
