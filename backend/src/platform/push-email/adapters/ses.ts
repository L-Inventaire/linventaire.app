import config from "config";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import nodemailer from "nodemailer";
import {
  EmailSendResultCallback,
  PushEMailInterfaceAdapterInterface,
} from "../api";
import { EmailAttachment } from "..";
import Framework from "../..";
import { Logger } from "../../logger-db";
import _ from "lodash";

export default class PushEMailSES
  implements PushEMailInterfaceAdapterInterface
{
  private ses: SESv2Client;
  private transporter: any;
  private logger: Logger;

  async init() {
    this.logger = Framework.LoggerDb.get("push-email-ses");
    this.logger.info(null, "Initializing SES adapter");

    this.ses = new SESv2Client({
      region: config.get<string>("aws.region"),
      credentials: {
        accessKeyId: config.get<string>("aws.id"),
        secretAccessKey: config.get<string>("aws.secret"),
      },
      ...(config.get<string>("email.ses.region")
        ? { region: config.get<string>("email.ses.region") }
        : {}),
    });

    // create Nodemailer SES transporter (nodemailer >= 7 only supports SESv2)
    this.transporter = nodemailer.createTransport({
      SES: { sesClient: this.ses, SendEmailCommand },
    });

    this.logger.info(null, "SES adapter initialized successfully");
    return this;
  }

  async push(email: {
    to: string[];
    message: {
      html: string;
      text: string;
      subject: string;
    };
    from: string;
    attachments?: EmailAttachment[];
  },
  _smtp?: unknown,
  onResult?: EmailSendResultCallback) {
    this.logger.info(null, `Sending email via SES to ${email.to.join(", ")}`);

    // Fire-and-forget: SES answers asynchronously, so we report the real
    // outcome through `onResult` when the SESv2 SendEmail callback fires
    // rather than blocking the caller. The raw MIME message is sent through
    // SESv2 SendEmail (the IAM policy must allow `ses:SendEmail`).
    this.transporter.sendMail(
      {
        from: email.from,
        to: email.to,
        subject: email.message.subject,
        text: email.message.text,
        html: email.message.html,
        attachments: email.attachments,
      },
      (err, info) => {
        if (err) {
          this.logger.error(null, "SES send failed", err);
          onResult?.({ success: false, error: err?.message || String(err) });
        } else {
          this.logger.info(
            null,
            "SES email sent successfully",
            _.omit(info, "raw")
          );
          onResult?.({ success: true });
        }
      }
    );
  }
}
