import framework from "./platform";
import services from "./services";
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import config from "config";

if (process.env.NODE_ENV === "production" || process.env.USE_SENTRY) {
  Sentry.init({
    dsn: "https://6000641de7ad74137addf9ac9d93b97a@o4508291579969536.ingest.de.sentry.io/4508291582394448",
    integrations: [nodeProfilingIntegration()],
    // Tracing
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    // Set environment to config.server.domain
    environment: config
      .get("server.domain")
      .split("//")
      .pop()
      .replace(/[^a-z.]/, ""),
  });
}

process.on("unhandledRejection", (reason, p) => {
  console.log("Unhandled Rejection at: Promise", p, "reason:", reason);
});

export const start = async () => {
  await framework.init();
  await services.init();
};

export const stop = async () => {
  if (services.internalServer) services.internalServer.close();
  //Wait 1s
  await new Promise((resolve) => setTimeout(resolve, 1000));
};

if (process.env.JEST !== "1") {
  start();
}
