import { init, revenue, Revenue, track } from "@amplitude/analytics-node";
import Big from "big.js";
import config from "config";
import { Context } from "../../types";
import platform from "..";
import { PlatformService } from "../types";

const useAmplitude = config.get<boolean>("analytics.amplitude.use");

export default class Analytics implements PlatformService {
  private logger = platform.LoggerDb.get("analytics");

  async init(): Promise<this> {
    if (useAmplitude) {
      init(config.get<string>("analytics.amplitude.key"), {
        flushIntervalMillis: 30 * 1000, // Sets request interval to 30s
      });
    } else {
      this.logger.info(
        {
          id: "-",
          role: "SYSTEM",
          req_id: "-",
        } as Context,
        "No analytics available."
      );
    }

    return this;
  }

  async trackEvent(ctx: Context, type: string, properties: any = {}) {
    try {
      if (useAmplitude) {
        this.logger.info(ctx, "trackEvent " + type);
        track({
          user_id: properties.user_id || ctx.id || "system",
          event_type: type,
          event_properties: { ...properties },
          user_properties: { user_id: properties.user_id || ctx.id },
          group_properties: {
            merchant_id: properties.merchant_id,
          },
        });
      }
    } catch (e) {
      console.log(e);
    }
  }

  async trackRevenue(
    ctx: Context,
    type: string,
    amount: Big | string,
    currency: string,
    from: string,
    to: string,
    transactionId: string
  ) {
    try {
      if (useAmplitude) {
        this.logger.info(
          ctx,
          "trackRevenue " + type + ` ${amount} ${currency}`
        );
        const e = new Revenue();
        e.setRevenue(Big(amount).toNumber());
        e.setEventProperties({
          user_id: from || ctx.id || "system",
          type: type + "_" + currency,
          currency,
          from,
          to,
          positive: Big(amount).gte(0),
          transaction_id: transactionId,
        });
        revenue(e, {
          user_id: from || ctx.id || "system",
        });
      }
    } catch (e) {
      console.log(e);
    }
  }
}
