import amqp from "amqp-connection-manager";
import type {
  ChannelWrapper,
  AmqpConnectionManager,
} from "amqp-connection-manager";
import config from "config";
import platform from "..";
import { Context, createContext } from "../../types";
import { id } from "../db/utils";
import { PlatformService } from "../types";
import { captureException } from "@sentry/node";

const useRabbit = config.get<boolean>("rabbit.use");
let rabbit: AmqpConnectionManager = null;

export default class Amqp implements PlatformService {
  private logger = platform.LoggerDb.get("amqp");
  private queues: { [key: string]: ChannelWrapper } = {};
  private localConsumers: {
    [key: string]: ((msg: any, ack: (data: any) => void) => void)[];
  } = {};

  async init(): Promise<this> {
    const connect = () => {
      rabbit = amqp.connect(config.get<string>("rabbit.url"));

      rabbit.on("connect", () => {
        this.logger.info(
          {
            id: "-",
            role: "SYSTEM",
            req_id: "-",
          } as Context,
          "connected"
        );
      });

      rabbit.on("disconnect", (err) => {
        this.logger.error(null, "error", err || new Error("Disconnected"));
        setTimeout(() => {
          rabbit.close();
          connect();
        }, 100);
      });
    };

    if (useRabbit) {
      connect();
    }
    return this;
  }

  public getClient() {
    return rabbit;
  }

  public async initQueue(queue: string) {
    if (!this.queues[queue] && useRabbit) {
      await new Promise((resolve, reject) => {
        this.queues[queue] = rabbit.createChannel({
          json: true,
          setup: async (channel) => {
            await Promise.all([channel.assertQueue(queue, { durable: false })]);
            resolve(true);
          },
        });
      });
    }
  }

  public async consume(
    queue: string,
    handler: (
      msg: {
        [key: string]: any;
        context: Context;
      },
      ack: (data: any) => void
    ) => void
  ): Promise<void> {
    const context = {
      ...createContext("amqp", "SYSTEM"),
      client_id: "",
      req_id: id(),
    } as Context;

    if (!useRabbit) {
      this.localConsumers[queue] ||= [];
      this.localConsumers[queue].push(handler);
      return;
    }

    await this.initQueue(queue);
    if (!this.queues[queue]) {
      this.logger.error(context, `Did not create queue ${queue}`);
      return;
    }
    this.queues[queue].addSetup(async (channel) => {
      await Promise.all([
        channel.assertQueue(queue, { durable: false }),
        channel.prefetch(1),
        channel.consume(queue, (data) => {
          this.logger.info(data.context, `Consuming task from queue ${queue}`, {
            data,
          });
          try {
            const message = JSON.parse(data.content.toString());
            handler(message, () => {
              this.queues[queue].ack(data);
            });
          } catch (e) {
            captureException(e);
            this.logger.error(
              context,
              `Error with amqp task '${queue}': ${e}`,
              e
            );
            platform.LoggerDb.flush();
          }
        }),
      ]);
    });
  }

  public async publish(
    context: Context,
    queue: string,
    data: { [key: string]: any }
  ) {
    data = { ...data, context };
    this.logger.info(context, `Publishing to queue ${queue}`, { data });

    if (!useRabbit) {
      this.logger.warn(
        context,
        `Publishing to ${queue} locally because rabbit is disabled`
      );
      this.localConsumers[queue]?.forEach((handler) => {
        handler(data, () => {
          //Nothing happens
        });
      });
      return;
    }

    await this.initQueue(queue);
    if (!this.queues[queue]) {
      this.logger.error(context, `Did not create queue ${queue}`);
      return;
    }
    await this.queues[queue].sendToQueue(queue, data);
  }
}
