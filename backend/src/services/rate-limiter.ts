import Framework from "#src/platform/index";
import config from "config";
import {
  RateLimiterAbstract,
  RateLimiterMemory,
  RateLimiterRedis,
} from "rate-limiter-flexible";
export { RateLimiterAbstract } from "rate-limiter-flexible";

const defaults = {
  points: 25,
  duration: 1,
};

export const createRateLimiter = async (
  name: string,
  options?: { points: number; duration: number }
) => {
  const useRedis = config.get<string>("redis.use");
  let rateLimiter: RateLimiterAbstract = null;
  if (useRedis && Framework.Redis.getClient()) {
    rateLimiter = new RateLimiterRedis({
      storeClient: Framework.Redis.getClient(),
      keyPrefix: "rate-limiter-" + name,
      ...(options || defaults),
    });
  } else {
    rateLimiter = new RateLimiterMemory(options || defaults);
  }
  return rateLimiter;
};
