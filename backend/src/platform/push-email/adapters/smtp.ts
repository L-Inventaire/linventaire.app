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

      // nodemailer returns per-recipient outcome: `accepted`/`rejected` list
      // the recipients the destination server acknowledged or refused during
      // the SMTP dialogue (RCPT TO), plus its final `response` line. It only
      // throws when the message couldn't be delivered to ANY recipient.
      const info = (await transporter.sendMail(mailOptions)) as {
        accepted?: unknown[];
        rejected?: unknown[];
        response?: string;
      };

      const rejected = info?.rejected ?? [];
      const accepted = info?.accepted ?? [];

      if (rejected.length > 0 || accepted.length === 0) {
        // The server accepted the connection but refused the recipient(s).
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
      // Distinguish a per-recipient rejection (permanent: bad mailbox / policy
      // — a different provider wouldn't help) from a transport/connection error
      // (the custom SMTP is unreachable → let the caller fall back).
      if (isRecipientRejection(error)) {
        const detail = rejectedDetail(
          error?.rejected,
          error?.response || error?.message
        );
        this.logger.error(
          null,
          `SMTP recipient(s) rejected via ${smtp.host}: ${detail}`
        );
        onResult?.({ success: false, error: detail });
        return; // do NOT rethrow: no fallback for a bad recipient
      }

      this.logger.error(null, `SMTP send failed via ${smtp.host}`, error);
      // Transport/connection failure: rethrow so the caller can fall back to
      // the default adapter (which then reports the real outcome).
      throw error;
    }
  }
}

/**
 * Whether a nodemailer error represents recipients being rejected by the
 * server (as opposed to a connection/auth/transport failure). nodemailer flags
 * envelope errors with `code: "EENVELOPE"` and/or a `rejected` list, and a 5xx
 * `responseCode` means a permanent SMTP-level refusal.
 */
const isRecipientRejection = (error: any): boolean => {
  if (!error) return false;
  if (Array.isArray(error.rejected) && error.rejected.length > 0) return true;
  if (error.code === "EENVELOPE") return true;
  if (
    typeof error.responseCode === "number" &&
    error.responseCode >= 500 &&
    error.responseCode < 600
  ) {
    return true;
  }
  return false;
};

/** Human-readable reason for a recipient rejection, for logs and the timeline. */
const rejectedDetail = (rejected: unknown, response?: string): string => {
  const list = Array.isArray(rejected)
    ? rejected.map((r) => (typeof r === "string" ? r : JSON.stringify(r)))
    : [];
  const who = list.length ? `rejected: ${list.join(", ")}` : "no recipient accepted";
  return response ? `${who} (${response})` : who;
};
