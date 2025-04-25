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
    smtp?: SmtpOptions
  ): Promise<void>;
}
