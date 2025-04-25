import { Express, Router } from "express";
import multer from "multer";
import { default as Framework, default as platform } from "../../../platform";
import { Logger } from "../../../platform/logger-db";
import { checkClientRoles, checkRole } from "../../../services/common";
import { Ctx } from "../../../services/utils";
import { InternalApplicationService } from "../../types";
import { FilesDefinition, Files as FilesType } from "./entities/files";
import { download, thumbnail, upload } from "./services/files";
import { setFilesTriggers } from "./services/triggers";
const multerUpload = multer({ storage: multer.memoryStorage() });

export default class Files implements InternalApplicationService {
  version = 1;
  name = "files";
  static logger: Logger;

  async init(server: Express) {
    const router = Router();
    server.use(`/api/${this.name}/v${this.version}`, router);

    const db = await platform.Db.getService();
    await db.createTable(FilesDefinition);

    Files.logger = Framework.LoggerDb.get("files");

    Framework.TriggersManager.registerEntities([FilesDefinition], {
      READ: "FILES_READ",
      WRITE: "FILES_WRITE",
      MANAGE: "FILES_MANAGE",
    });

    setFilesTriggers();

    // To upload / download / thumbnail documents, we'll have a special endpoint not related to REST

    // /upload
    router.post(
      "/:clientId/upload",
      checkRole("USER"),
      checkClientRoles(["FILES_WRITE"]),
      multerUpload.single("file"),
      async (req, res) => {
        const ctx = Ctx.get(req)?.context;
        const entity = JSON.parse(req.body.entity) as FilesType;
        const content = req.file.buffer;
        res.send(await upload(ctx, entity, content));
      }
    );

    // /download?key=&mime=&name=client_id=
    router.get("/:clientId/download/:key", async (req, res) => {
      const ctx = Ctx.get(req)?.context;
      const file = req.query as unknown as FilesType;
      res.setHeader("Content-Type", file.mime);
      if (req.query?.preview) {
        res.setHeader("Content-Disposition", `inline`);
      } else {
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${file.name}"`
        );
      }
      res.send(
        Buffer.from(
          await download(ctx, {
            key: req.params.key as string,
            client_id: req.params.clientId,
          })
        )
      );
    });

    // /thumbnail?key=client_id=
    router.get("/:clientId/thumbnails/:key", async (req, res) => {
      const ctx = Ctx.get(req)?.context;
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Disposition", `inline`);
      const thb = await thumbnail(ctx, {
        key: req.params.key as string,
        client_id: req.params.clientId,
      });
      res.send(Buffer.from(thb));
    });

    console.log(`${this.name}:v${this.version} initialized`);

    return this;
  }
}
