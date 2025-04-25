import config from "config";
import platform from "..";
import { Context } from "../../types";
import { PlatformService } from "../types";
import PushTextMessageFile from "./adapters/file";
import PushTextMessageSNS from "./adapters/sns";
import { PushTextMessageAdapterInterface } from "./api";

export default class PushTextMessageService implements PlatformService {
  private service: PushTextMessageAdapterInterface;

  async init() {
    if (config.get<string>("sms.type") === "sns") {
      console.log("PushTextMessage: Using SNS");
      this.service = await new PushTextMessageSNS().init();
    } else {
      console.log("PushTextMessage: Using File");
      this.service = await new PushTextMessageFile().init();
    }
    return this;
  }

  async push(
    context: Context,
    phone: string,
    message: string,
    sender?: string
  ) {
    try {
      await this.service.push({
        to: phone,
        message,
        sender: sender || config.get<string>("email.from"),
      });
    } catch (err) {
      platform.LoggerDb.get("push-text-message").error(context, err);
    }
  }
}
