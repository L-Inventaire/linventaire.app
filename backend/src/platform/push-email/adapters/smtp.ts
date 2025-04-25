import nodemailer from "nodemailer";
import { EmailAttachment } from "..";
import { PushEMailInterfaceAdapterInterface, SmtpOptions } from "../api";

export default class PushEMailSmtp
  implements PushEMailInterfaceAdapterInterface
{
  async init() {
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
      };

      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Error sending email: ", error);
      throw error;
    }
  }
}
