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
      multerUpload.single("file") as any,
      async (req, res) => {
        const ctx = Ctx.get(req)!.context;
        const entity = JSON.parse(req.body.entity) as FilesType;
        const content = req.file.buffer;
        res.send(await upload(ctx, entity, content));
      }
    );

    // /download/:key
    // NOTE: these file endpoints are unauthenticated capability URLs: access
    // relies on the unguessable UUIDv4 `key` (and the client_id path segment).
    // They cannot require an Authorization header because the URLs are used
    // directly in <img src> / <a href>. Moving to short-lived signed URLs is
    // tracked as a follow-up. Below we at least remove the stored-XSS vector.
    router.get("/:clientId/download/:key", async (req, res) => {
      const ctx = Ctx.get(req)!.context;

      // Security: never trust the mime/name coming from the query string
      // (they would let an attacker force an executable Content-Type and get
      // stored XSS on the API domain via ?preview=1). Read the authoritative
      // metadata from the file row instead.
      const fileRow = await db.selectOne<FilesType>(ctx, FilesDefinition.name, {
        key: req.params.key as string,
        client_id: req.params.clientId,
      });
      if (!fileRow) return res.status(404).json({ error: "Not found" });

      res.setHeader("Content-Type", fileRow.mime || "application/octet-stream");
      res.setHeader("X-Content-Type-Options", "nosniff");
      if (req.query?.preview) {
        res.setHeader("Content-Disposition", `inline`);
      } else {
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${(fileRow.name || "")
            .normalize()
            .replace(/[^.\-A-Za-z0-9]+/gm, "_")}"`
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

    // /thumbnails/:key
    router.get("/:clientId/thumbnails/:key", async (req, res) => {
      const ctx = Ctx.get(req)!.context;
      res.setHeader("Content-Type", "image/png");
      res.setHeader("X-Content-Type-Options", "nosniff");
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
