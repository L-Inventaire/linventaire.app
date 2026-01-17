import config from "config";
import { SES } from "@aws-sdk/client-ses";
import { PushEMailInterfaceAdapterInterface } from "../api";
import { EmailAttachment } from "..";
import Framework from "../..";
import { Logger } from "../../logger-db";

export default class PushEMailSES
  implements PushEMailInterfaceAdapterInterface
{
  private ses: SES;
  private transporter: any;
  private logger: Logger;

  async init() {
    this.logger = Framework.LoggerDb.get("push-email-ses");
    this.logger.info(null, "Initializing SES adapter");

    this.ses = new SES({
      apiVersion: "2010-12-01",
      region: config.get<string>("aws.region"),
      credentials: {
        accessKeyId: config.get<string>("aws.id"),
        secretAccessKey: config.get<string>("aws.secret"),
      },
      ...(config.get<string>("email.ses.region")
        ? { region: config.get<string>("email.ses.region") }
        : {}),
    });

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodemailer = require("nodemailer");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const aws = require("@aws-sdk/client-ses");

    // create Nodemailer SES transporter
    this.transporter = nodemailer.createTransport({
      SES: { ses: this.ses, aws },
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
  }) {
    this.logger.info(null, `Sending email via SES to ${email.to.join(", ")}`);

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
        } else {
          this.logger.info(null, "SES email sent successfully", info);
        }
      }
    );
  }
}
