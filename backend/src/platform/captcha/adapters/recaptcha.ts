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
    let action = "captcha";
    if (token.split(":").length > 1) {
      action = token.split(":")[0];
      token = token.split(":").slice(1).join(":");
    }

    const result = await axios.post(
      `https://recaptchaenterprise.googleapis.com/v1/projects/${this.project_id}/assessments?key=${this.api_key}`,
      {
        event: {
          token: token,
          siteKey: this.site_key,
          expectedAction: action,
          // Include IP address when available
          userIpAddress: ip || "",
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 5000,
      }
    );

    // Log detailed information for debugging
    console.log("Captcha response:", JSON.stringify(result.data, null, 2));

    // Check for valid token first
    if (!result.data?.tokenProperties?.valid) {
      throw new Error(
        `Invalid reCAPTCHA token: ${
          result.data?.tokenProperties?.invalidReason || "unknown reason"
        }`
      );
    }

    // Check for action match
    if (result.data?.tokenProperties?.action !== "captcha") {
      throw new Error(
        `Action mismatch: expected "captcha", got "${result.data?.tokenProperties?.action}"`
      );
    }

    // Check for score
    if (typeof result.data?.riskAnalysis?.score !== "number") {
      throw new Error(
        "Missing risk score in reCAPTCHA response: " +
          JSON.stringify(result.data)
      );
    }

    const score = result.data.riskAnalysis.score;
    console.log(`Captcha score: ${score} (Threshold: 0.5)`);

    // If score is too low but everything else looks good, provide better error message
    if (score <= 0.5) {
      console.warn(
        `Low reCAPTCHA score (${score}), challenge status: ${result.data.riskAnalysis.challenge}`
      );
      // You could throw an error here instead of returning false if you want to force a retry
    }

    return score > 0.5;
  }
}
