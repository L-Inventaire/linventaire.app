import { EmailAttachment } from ".";
import { PlatformService } from "../types";

export type SmtpOptions = {
  enabled: boolean;
  from: string;
  host: string;
  port: number;
  user: string;
  pass: string;
  tls: boolean;
  dkim?: {
    domainName: string;
    keySelector: string;
    privateKey: string;
  };
};

/**
 * Outcome of an email send attempt as reported by the underlying transport.
 * `success` reflects whether the transport *accepted* the message for delivery
 * (SMTP: the server accepted it; SES: SendRawEmail returned without error). It
 * does NOT reflect an asynchronous bounce that may happen later — detecting
 * those would require SNS/DSN feedback, which we deliberately don't wire here.
 */
export type EmailSendResult = { success: boolean; error?: string };

export type EmailSendResultCallback = (result: EmailSendResult) => void;

export interface PushEMailInterfaceAdapterInterface extends PlatformService {
  push(
    email: {
      to: string[];
      message: {
        html: string;
        text: string;
        subject: string;
      };
      attachments?: EmailAttachment[];
      from: string;
    },
    smtp?: SmtpOptions,
    // Invoked once the transport knows the real outcome. For SES this happens
    // asynchronously, after `push` has already resolved, hence the callback.
    onResult?: EmailSendResultCallback
  ): Promise<void>;
}
