import { S3 } from "@aws-sdk/client-s3";
import config from "config";
import fs from "fs";
import Framework from "..";
import { Logger } from "../logger-db";
import { PlatformService } from "../types";

export default class S3Service implements PlatformService {
  private bucket: string;
  private s3: S3;
  private logger: Logger;

  async init() {
    if (config.get<boolean>("s3.use")) {
      this.s3 = new S3({
        region: config.get<string>("aws.region"),
        credentials: {
          accessKeyId: config.get<string>("aws.id"),
          secretAccessKey: config.get<string>("aws.secret"),
        },
      });
      this.bucket = config.get<string>("s3.bucket");
    }

    this.logger = Framework.LoggerDb.get("S3");

    return this;
  }

  async upload(key: string, data: string | Buffer) {
    if (data === undefined || data === null) {
      this.logger.warn(null, `No data provided for upload to S3 key ${key}`);
      return;
    }

    this.logger.info(null, `Uploading data to S3 key ${key}`);

    if (config.get<boolean>("s3.use")) {
      await this.s3.putObject({
        Bucket: this.bucket,
        Key: key,
        Body: data,
      });
    } else {
      const localPath = config.get<string>("s3.local_path");
      const fullPath =
        localPath.replace(/\/$/, "") +
        "/" +
        key.replace(/\.\./gm, "").replace(/^\//, "");
      fs.mkdirSync(fullPath.split("/").slice(0, -1).join("/"), {
        recursive: true,
      });
      fs.writeFileSync(fullPath, data);
    }
  }

  async download(key: string): Promise<Buffer> {
    this.logger.info(null, `Downloading data from S3 key ${key}`);

    if (config.get<boolean>("s3.use")) {
      return Buffer.from(
        (
          await (
            await this.s3.getObject({
              Bucket: this.bucket,
              Key: key,
            })
          ).Body.transformToByteArray()
        ).buffer
      );
    } else {
      const localPath = config.get<string>("s3.local_path");
      const fullPath =
        localPath.replace(/\/$/, "") +
        "/" +
        key.replace(/\.\./gm, "").replace(/^\//, "");
      return fs.readFileSync(fullPath);
    }
  }

  async delete(key: string) {
    this.logger.info(null, `Deleting data from S3 key ${key}`);
    if (config.get<boolean>("s3.use")) {
      await this.s3.deleteObject({
        Bucket: this.bucket,
        Key: key,
      });
    } else {
      const localPath = config.get<string>("s3.local_path");
      const fullPath =
        localPath.replace(/\/$/, "") +
        "/" +
        key.replace(/\.\./gm, "").replace(/^\//, "");
      fs.unlinkSync(fullPath);
    }
  }
}
