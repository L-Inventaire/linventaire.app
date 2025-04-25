import config from "config";
import { Context as Context } from "../../types";
import { PlatformService } from "../types";
import CaptchaReCaptcha from "./adapters/recaptcha";
import { CaptchaAdapterInterface } from "./api";

export default class Captcha implements PlatformService {
  private service: CaptchaAdapterInterface;

  async init() {
    if (config.get<string>("captcha.type") === "recaptcha") {
      console.log("Captcha: Using ReCaptcha");
      this.service = await new CaptchaReCaptcha().init();
    } else {
      console.log("Captcha: Disabled");
    }
    return this;
  }

  async verify(context: Context, token: string) {
    if (!this.service) {
      return true;
    }
    return await this.service.verify(token, context.ip);
  }
}
