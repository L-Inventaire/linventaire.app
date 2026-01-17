import config from "config";
import fs from "fs";
import Framework from "../..";
import { Logger } from "../../logger-db";
import { PushEMailInterfaceAdapterInterface } from "../api";

export default class PushEMailFile
  implements PushEMailInterfaceAdapterInterface
{
  private logger: Logger;

  async init() {
    this.logger = Framework.LoggerDb.get("push-email-file");
    const path = config.get<string>("email.file.path");
    fs.mkdirSync(path, { recursive: true });
    this.logger.info(null, `File adapter initialized at path: ${path}`);
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
  }) {
    const path = config.get<string>("email.file.path");
    const filename = `${path}/${Date.now()}.txt`;
    this.logger.info(null, `Writing email to file: ${filename}`);
    fs.writeFileSync(filename, email.message.text);
  }
}
