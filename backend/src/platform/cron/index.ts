import { Context, createContext } from "#src/types";
import cron from "croner";
import platform from "..";
import { id } from "../db/utils";
import { captureException } from "@sentry/node";

const CronService = {
  schedule: (
    name: string,
    // ┌──────────────── (optional) second (0 - 59)
    // │ ┌────────────── minute (0 - 59)
    // │ │ ┌──────────── hour (0 - 23)
    // │ │ │ ┌────────── day of month (1 - 31)
    // │ │ │ │ ┌──────── month (1 - 12, JAN-DEC)
    // │ │ │ │ │ ┌────── day of week (0 - 6, SUN-Mon)
    // │ │ │ │ │ │       (0 to 6 are Sunday to Saturday; 7 is Sunday, the same as 0)
    // │ │ │ │ │ │
    // * * * * * *
    cronExpression: string,
    callback: (ctx: Context) => Promise<void>
  ) => {
    cron(
      cronExpression,
      async () => {
        const ctx = {
          ...createContext("cron", "SYSTEM"),
          client_id: "",
          req_id: id(),
        } as Context;

        await new Promise((resolve) =>
          setTimeout(resolve, Math.random() * 1000)
        );

        const lockId = await platform.Lock.acquire(
          ctx,
          "cron-" + name,
          60 * 1000
        );
        let extendTimeout: NodeJS.Timeout;

        try {
          if (!lockId) {
            platform.LoggerDb.get("CronService").info(
              ctx,
              `(Run cron job '${name}' on other instance)`
            );
            return;
          }

          platform.LoggerDb.get("CronService").info(
            ctx,
            `Run cron job '${name}'`
          );

          extendTimeout = setInterval(async () => {
            if (!(await platform.Lock.extend(ctx, lockId, 60 * 1000))) {
              captureException(
                new Error(`Failed to extend lock for cron job '${name}'`)
              );
            }
          }, 30 * 1000);

          await callback(ctx);
        } catch (e) {
          platform.LoggerDb.get("CronService").error(
            ctx,
            `Error with cron job '${name}': ${e}`,
            e
          );
          await platform.LoggerDb.flush();
          captureException(e);
        }

        clearInterval(extendTimeout);

        //Make sure the lock is maintained few seconds in cas operation was too fast
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await platform.Lock.release(ctx, lockId);
      },
      {
        name,
        timezone: "Europe/Oslo",
      }
    );
  },
};

export default CronService;
