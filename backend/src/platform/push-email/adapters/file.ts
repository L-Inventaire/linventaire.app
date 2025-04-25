import config from "config";
import fs from "fs";
import { PushEMailInterfaceAdapterInterface } from "../api";

export default class PushEMailFile
  implements PushEMailInterfaceAdapterInterface
{
  async init() {
    const path = config.get<string>("email.file.path");
    fs.mkdirSync(path, { recursive: true });
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
    fs.writeFileSync(filename, email.message.text);
  }
}
