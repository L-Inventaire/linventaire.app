import nodemailer from "nodemailer";
import { EmailAttachment } from "..";
import {
  EmailSendResultCallback,
  PushEMailInterfaceAdapterInterface,
  SmtpOptions,
} from "../api";
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
    smtp: SmtpOptions,
    onResult?: EmailSendResultCallback
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
        tls: {
          rejectUnauthorized: false,
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

      // nodemailer returns per-recipient outcome: `accepted`/`rejected` are the
      // recipients the destination server acknowledged or refused during the
      // SMTP dialogue (RCPT TO), plus its final `response` line. It only throws
      // when the message couldn't be delivered to ANY recipient.
      const info = (await transporter.sendMail(mailOptions)) as {
        accepted?: unknown[];
        rejected?: unknown[];
        response?: string;
      };

      const rejected = info?.rejected ?? [];
      const accepted = info?.accepted ?? [];

      if (accepted.length === 0) {
        // Nobody accepted the message. We can't tell a genuinely bad mailbox
        // apart from a misconfigured custom SMTP (relay/sender denied, auth),
        // so treat it as a transport failure and let the caller fall back to
        // the default adapter — a misconfigured SMTP must not block delivery.
        throw new Error(
          `SMTP delivery failed via ${smtp.host}: ${rejectedDetail(
            rejected,
            info?.response
          )}`
        );
      }

      if (rejected.length > 0) {
        // Partial: the transport clearly works (some recipients were
        // accepted), so the rejected ones are genuinely bad recipients. Report
        // them without falling back — a different provider won't fix a bad
        // mailbox, and the good recipients already received the document.
        const detail = rejectedDetail(rejected, info?.response);
        this.logger.error(
          null,
          `SMTP recipient(s) rejected via ${smtp.host}: ${detail}`
        );
        onResult?.({ success: false, error: detail });
        return;
      }

      this.logger.info(
        null,
        `SMTP email sent successfully via ${smtp.host}${
          info?.response ? ` (${info.response})` : ""
        }`
      );
      onResult?.({ success: true });
    } catch (error: any) {
      this.logger.error(null, `SMTP send failed via ${smtp.host}`, error);
      // Any total failure (connection, auth, relay denied, or all recipients
      // rejected) is rethrown so the caller can fall back to the default
      // adapter, which then reports the real outcome.
      throw error;
    }
  }
}

/** Human-readable reason for a recipient rejection, for logs and the timeline. */
const rejectedDetail = (rejected: unknown, response?: string): string => {
  const list = Array.isArray(rejected)
    ? rejected.map((r) => (typeof r === "string" ? r : JSON.stringify(r)))
    : [];
  const who = list.length ? `rejected: ${list.join(", ")}` : "no recipient accepted";
  return response ? `${who} (${response})` : who;
};
