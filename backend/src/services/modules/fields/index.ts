import { Express, Router } from "express";
import { default as Framework, default as platform } from "../../../platform";
import { Logger } from "../../../platform/logger-db";
import { InternalApplicationService } from "../../types";
import { FieldsDefinition } from "./entities/fields";
import { checkRole } from "#src/services/common";
import { Ctx } from "#src/services/utils";
import config from "config";
import jwt from "jsonwebtoken";

export default class Fields implements InternalApplicationService {
  version = 1;
  name = "fields";
  private logger: Logger;

  async init(server: Express) {
    const router = Router();

    router.post(
      "/:clientId/signatures",
      checkRole("USER"),
      async (req, res) => {
        try {
          const ctx = Ctx.get(req)?.context;
          const userId = ctx?.id;
          const { clientId } = req.params;
          const signSecret = config.get("signatures.secret");
          const { svg, full_name } = req.body;

          if (!svg) {
            return res.status(400).json({ error: "Missing svg data" });
          }

          // Get current timestamp
          const timestamp = new Date();

          // Create server signature using JWT
          const server_signature = jwt.sign(
            {
              svg,
              full_name: full_name || "",
              date: timestamp.toISOString(),
              user_id: userId,
              client_id: clientId,
            },
            signSecret,
            { expiresIn: "10y" } // 10 year expiration, effectively permanent
          );

          // Return the signature data
          return res.status(200).json({
            svg,
            full_name: full_name || "",
            date: timestamp.toISOString(),
            server_signature,
          });
        } catch (error) {
          console.error("Failed to create signature:", error);
          return res.status(500).json({ error: "Failed to create signature" });
        }
      }
    );

    // Endpoint to verify a signature
    router.post(
      "/:clientId/verify-signature",
      checkRole("USER"),
      async (req, res) => {
        try {
          const { clientId } = req.params;
          const { server_signature } = req.body;
          const signSecret = config.get("signatures.secret");

          if (!server_signature) {
            return res.status(400).json({ error: "Missing signature data" });
          }

          try {
            // Verify the signature
            const decoded = jwt.verify(server_signature, signSecret);

            // Check if the signature belongs to the correct client
            if (decoded.client_id !== clientId) {
              return res.status(403).json({
                error: "Invalid signature for this client",
                valid: false,
              });
            }

            return res.status(200).json({
              valid: true,
              data: decoded,
            });
          } catch (jwtError) {
            return res
              .status(400)
              .json({ error: "Invalid signature", valid: false });
          }
        } catch (error) {
          console.error("Failed to verify signature:", error);
          return res.status(500).json({ error: "Failed to verify signature" });
        }
      }
    );

    server.use(`/api/${this.name}/v${this.version}`, router);

    const db = await platform.Db.getService();
    await db.createTable(FieldsDefinition);

    this.logger = Framework.LoggerDb.get("fields");

    Framework.TriggersManager.registerEntities([FieldsDefinition], {
      READ: "FIELDS_READ",
      WRITE: "FIELDS_WRITE",
      MANAGE: "FIELDS_MANAGE",
    });

    console.log(`${this.name}:v${this.version} initialized`);

    return this;
  }

  // Here will go the exported functions for other services
}
