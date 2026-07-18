import config from "config";
import platform from "..";
import { Context as Context } from "../../types";
import { PlatformService } from "../types";
import PushEMailFile from "./adapters/file";
import PushEMailSES from "./adapters/ses";
import {
  EmailSendResult,
  EmailSendResultCallback,
  PushEMailInterfaceAdapterInterface,
  SmtpOptions,
} from "./api";
import { buildHTML } from "./build-email";
import Framework from "..";
import PushEMailSmtp from "./adapters/smtp";
import { captureException } from "@sentry/node";
import { Logger } from "../logger-db";

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
  private service!: PushEMailInterfaceAdapterInterface;
  private smtpService!: PushEMailInterfaceAdapterInterface;
  private logger!: Logger;

  async init() {
    this.logger = Framework.LoggerDb.get("push-email");

    this.smtpService = await new PushEMailSmtp().init();
    if (config.get<string>("email.type") === "ses") {
      this.logger.info(null, "Initializing PushEmail with SES adapter");
      this.service = await new PushEMailSES().init();
    } else {
      this.logger.info(null, "Initializing PushEmail with File adapter");
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
    smtp?: SmtpOptions,
    // Optional: reports the transport's real send outcome. For SES this fires
    // asynchronously, after this method has already returned its optimistic
    // boolean, which is why callers that care about failures must rely on this
    // callback (e.g. through a deferred check) rather than the return value.
    onResult?: EmailSendResultCallback
  ): Promise<boolean> {
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
    } catch (e: any) {
      platform.LoggerDb.get("push-email").error(context, e);
      captureException(e);
      onResult?.({ success: false, error: "Failed to render email" });
      return false;
    }

    // Demo whitelisting system
    const useWhitelisting = config
      .get<string>("server.domain")
      .includes("demo");
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
      this.logger.info(
        context,
        `Sending email to ${to.join(", ")} with subject: ${subject}`
      );

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
        this.logger.info(context, "Using custom SMTP configuration");

        // Try the custom SMTP first. It reports its outcome synchronously
        // through the callback, flagging `retryable` when the SMTP itself is
        // unusable (transport/config problem) rather than a specific recipient
        // being rejected.
        let smtpResult: EmailSendResult | undefined;
        await this.smtpService.push(body, smtp, (r) => (smtpResult = r));

        if (smtpResult && !smtpResult.retryable) {
          // Definitive outcome: delivered, or specific recipients rejected
          // while the transport worked. Don't fall back — forward it as-is.
          onResult?.(smtpResult);
          return smtpResult.success;
        }

        // The custom SMTP is unusable: fall back to the default adapter, which
        // reports the real outcome via onResult.
        this.logger.info(context, "Falling back to default adapter");
        await this.service.push(body, undefined, onResult);
        return true;
      }

      await this.service.push(body, undefined, onResult);
      this.logger.info(context, "Email sent successfully via default adapter");
      return true;
    } catch (err) {
      this.logger.error(context, "Failed to send email", err);
      onResult?.({ success: false, error: (err as any)?.message || String(err) });
      return false;
    }
  }
}
