import config from "config";
import { SNS } from "@aws-sdk/client-sns";
import { PushTextMessageAdapterInterface } from "../api";

export default class PushTextMessageSNS
  implements PushTextMessageAdapterInterface
{
  private sns: SNS;

  async init() {
    this.sns = new SNS({
      apiVersion: "2010-03-31",
      region: config.get<string>("aws.region"),
      ...(config.get<string>("sms.sns.region")
        ? { region: config.get<string>("sms.sns.region") }
        : {}),
      credentials: {
        accessKeyId: config.get<string>("aws.id"),
        secretAccessKey: config.get<string>("aws.secret"),
      },
    });
    this.sns.setSMSAttributes({
      attributes: {
        DefaultSMSType: "Transactional",
      },
    });
    return this;
  }

  async push(sms: { message: string; to: string; sender: string }) {
    const params = {
      Message: sms.message,
      PhoneNumber: sms.to,
      MessageAttributes: {
        "AWS.SNS.SMS.SenderID": {
          DataType: "String",
          StringValue: sms.sender || "Application",
        },
      },
    };
    await this.sns.publish(params);
  }
}
