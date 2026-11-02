import config from "config";
import { Context as Context } from "../../types";
import { PlatformService } from "../types";
import CaptchaReCaptcha from "./adapters/recaptcha";
import { CaptchaAdapterInterface } from "./api";

export default class Captcha implements PlatformService {
  private service: CaptchaAdapterInterface;

  async init() {
    const keysMissing =
      !config.get<string>("captcha.recaptcha.project_id") ||
      !config.get<string>("captcha.recaptcha.api_key");
    if (
      config.get<string>("captcha.type") === "recaptcha" &&
      keysMissing &&
      process.env.NODE_ENV !== "production"
    ) {
      // Local development: no ReCaptcha keys, every login would be refused
      console.log("Captcha: Disabled (no ReCaptcha keys outside production)");
    } else if (config.get<string>("captcha.type") === "recaptcha") {
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
