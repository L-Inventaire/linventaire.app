import { PushTextMessageAdapterInterface } from "../api";
import fs from "fs";
import config from "config";

export default class PushTextMessageFile
  implements PushTextMessageAdapterInterface
{
  async init() {
    const path = config.get<string>("sms.file.path");
    fs.mkdirSync(path, { recursive: true });
    return this;
  }

  async push(sms: { message: string; to: string; sender: string }) {
    const path = config.get<string>("sms.file.path");
    const filename = `${path}/${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(sms));
  }
}
