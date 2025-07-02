import { CaptchaAdapterInterface } from "../api";
import config from "config";
import axios from "axios";

export default class CaptchaRecaptcha implements CaptchaAdapterInterface {
  private site_key: string;
  private project_id: string;
  private api_key: string;

  async init(): Promise<this> {
    this.site_key = config.get<string>("captcha.recaptcha.site_key");
    this.project_id = config.get<string>("captcha.recaptcha.project_id");
    this.api_key = config.get<string>("captcha.recaptcha.api_key");
    return this;
  }

  async verify(token: string, ip?: string): Promise<boolean> {
    const result = await axios.post(
      `https://recaptchaenterprise.googleapis.com/v1/projects/${this.project_id}/assessments?key=${this.api_key}`,
      {
        event: {
          token: token,
          siteKey: this.site_key,
          expectedAction: "captcha",
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 5000,
      }
    );

    if (!result.data?.riskAnalysis?.score) {
      throw new Error(
        "Invalid response from reCAPTCHA service: " +
          JSON.stringify(result.data)
      );
    }

    console.log("Captcha score:", JSON.stringify(result.data));
    return result.data?.riskAnalysis?.score > 0.5;
  }
}
