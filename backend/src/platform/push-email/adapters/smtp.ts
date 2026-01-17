import nodemailer from "nodemailer";
import { EmailAttachment } from "..";
import { PushEMailInterfaceAdapterInterface, SmtpOptions } from "../api";
import Framework from "../..";
import { Logger } from "../../logger-db";

export default class PushEMailSmtp
  implements PushEMailInterfaceAdapterInterface
{
  private logger: Logger;

  async init() {
    this.logger = Framework.LoggerDb.get("push-email-smtp");
    this.logger.info(null, "SMTP adapter initialized");
    return this;
  }

  async push(
    email: {
      to: string[];
      message: {
        html: string;
        text: string;
        subject: string;
      };
      from: string;
      attachments?: EmailAttachment[];
    },
    smtp: SmtpOptions
  ) {
    this.logger.info(
      null,
      `Sending email via SMTP (${smtp.host}:${smtp.port}) to ${email.to.join(
        ", "
      )}`
    );

    try {
      const transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.tls, // true for 465, false for other ports
        auth: {
          user: smtp.user,
          pass: smtp.pass,
        },
        ...(smtp.dkim?.domainName
          ? {
              dkim: {
                domainName: smtp.dkim.domainName,
                keySelector: smtp.dkim.keySelector,
                privateKey: smtp.dkim.privateKey,
              },
            }
          : {}),
      });

      const mailOptions = {
        from: smtp.from,
        to: email.to.join(","),
        subject: email.message.subject,
        text: email.message.text,
        html: email.message.html,
        attachments: email.attachments?.map((attachment) => ({
          filename: attachment.filename,
          content: attachment.content,
          encoding: "base64",
        })),
        headers: {
          "X-Mailer": "L'inventaire",
          "X-Auto-Response-Suppress": "All",
        },
      };

      await transporter.sendMail(mailOptions);
      this.logger.info(null, `SMTP email sent successfully via ${smtp.host}`);
    } catch (error) {
      this.logger.error(null, `SMTP send failed via ${smtp.host}`, error);
      throw error;
    }
  }
}
