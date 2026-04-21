import { SuperPDPClient } from "#src/platform/e-invoices/adapters/superpdp/client";
import Framework from "#src/platform/index";
import { Ctx } from "#src/services/utils";
import { Router } from "express";
import { checkClientRoles, checkRole } from "../../common";
import {
  EInvoicingConfig,
  EInvoicingConfigDefinition,
} from "./entities/e-invoicing-config";
import { decrypt, encrypt } from "./utils/encryption";
import { create, remove, update } from "#src/services/rest/services/rest";

export default (router: Router) => {
  /**
   * GET /:clientId/config
   * Get e-invoicing configuration for a client
   */
  router.get(
    "/:clientId/config",
    checkRole("USER"),
    checkClientRoles(["CLIENT_MANAGE"]),
    async (req, res) => {
      try {
        const ctx = Ctx.get(req)?.context;
        if (!ctx) throw new Error("No context");

        const db = await Framework.Db.getService();

        const configs = await db.select<EInvoicingConfig>(
          ctx,
          EInvoicingConfigDefinition.name,
          {
            client_id: ctx.client_id,
          },
          { limit: 1 }
        );

        const config = configs[0];

        if (!config) {
          return res.json({ config: null });
        }

        // Don't send encrypted secrets to frontend
        const sanitized = {
          ...config,
          integration_client_secret_encrypted:
            config.integration_client_secret_encrypted ? "***" : "",
          access_token_encrypted: config.access_token_encrypted ? "***" : "",
          refresh_token_encrypted: config.refresh_token_encrypted ? "***" : "",
        };

        res.json({ config: sanitized });
      } catch (error: any) {
        console.error("Error fetching e-invoicing config:", error);
        res.status(500).json({ error: error.message });
      }
    }
  );

  /**
   * POST /:clientId/config
   * Create or update e-invoicing configuration
   */
  router.post(
    "/:clientId/config",
    checkRole("USER"),
    checkClientRoles(["CLIENT_MANAGE"]),
    async (req, res) => {
      try {
        const ctx = Ctx.get(req)?.context;
        if (!ctx) throw new Error("No context");

        const { client_id, client_secret, pdp_provider } = req.body;

        if (!client_id || !client_secret) {
          return res
            .status(400)
            .json({ error: "client_id and client_secret are required" });
        }

        // Encrypt the secret
        const encryptedSecret = encrypt(client_secret);

        const db = await Framework.Db.getService();

        // Check if config already exists
        const existingConfigs = await db.select<EInvoicingConfig>(
          ctx,
          EInvoicingConfigDefinition.name,
          {
            client_id: ctx.client_id,
          },
          { limit: 1 }
        );

        let config;
        if (existingConfigs[0]) {
          // Update existing
          await update(
            ctx,
            EInvoicingConfigDefinition.name,
            { id: existingConfigs[0].id, client_id: ctx.client_id },
            {
              pdp_provider: pdp_provider || "superpdp",
              integration_client_id: client_id,
              integration_client_secret_encrypted: encryptedSecret,
              connection_status: "not_configured",
            }
          );
          config = await db.selectOne<EInvoicingConfig>(
            ctx,
            EInvoicingConfigDefinition.name,
            { id: existingConfigs[0].id, client_id: ctx.client_id }
          );
        } else {
          // Create new
          await create(ctx, EInvoicingConfigDefinition.name, {
            pdp_provider: pdp_provider || "superpdp",
            integration_client_id: client_id,
            integration_client_secret_encrypted: encryptedSecret,
            connection_status: "not_configured",
            receive_enabled: false,
            send_enabled: false,
          });
          const configs = await db.select<EInvoicingConfig>(
            ctx,
            EInvoicingConfigDefinition.name,
            { client_id: ctx.client_id },
            { limit: 1 }
          );
          config = configs[0];
        }

        // Sanitize response
        const sanitized = {
          ...(config as any),
          integration_client_secret_encrypted: "***",
        };

        res.json({ config: sanitized });
      } catch (error: any) {
        console.error("Error saving e-invoicing config:", error);
        res.status(500).json({ error: error.message });
      }
    }
  );

  /**
   * POST /:clientId/test-connection
   * Test connection to SuperPDP and fetch company info
   */
  router.post(
    "/:clientId/test-connection",
    checkRole("USER"),
    checkClientRoles(["CLIENT_MANAGE"]),
    async (req, res) => {
      try {
        const ctx = Ctx.get(req)?.context;
        if (!ctx) throw new Error("No context");

        const db = await Framework.Db.getService();

        // Get config
        const configs = await db.select<EInvoicingConfig>(
          ctx,
          EInvoicingConfigDefinition.name,
          {
            client_id: ctx.client_id,
          },
          { limit: 1 }
        );

        const config = configs[0];
        if (!config) {
          return res.status(404).json({
            error: "No configuration found. Please save configuration first.",
          });
        }

        // Decrypt secret
        const clientSecret = decrypt(
          config.integration_client_secret_encrypted
        );
        if (!clientSecret) {
          return res
            .status(400)
            .json({ error: "Failed to decrypt client secret" });
        }

        // Test connection
        const client = Framework.EInvoices.getClient({
          clientId: config.integration_client_id,
          clientSecret,
        });

        const result = await client.testConnection();

        console.log(result);

        if (result.success && result.company) {
          // Update config with company info and connection status
          await update(
            ctx,
            EInvoicingConfigDefinition.name,
            { id: config.id, client_id: ctx.client_id },
            {
              connection_status: "connected",
              superpdp_company_id: result.company.id,
              superpdp_company: {
                ...result.company,
                created_at: new Date(result.company.created_at).getTime(),
                mandates: (result.company.mandates || []).map((m) => ({
                  ...m,
                  created_at: new Date(m.created_at),
                })),
              },
              last_connection_test: Date.now(),
              last_error: "",
            }
          );

          res.json({
            success: true,
            company: result.company,
          });
        } else {
          // Update config with error
          await update(
            ctx,
            EInvoicingConfigDefinition.name,
            { id: config.id, client_id: ctx.client_id },
            {
              connection_status: "error",
              last_connection_test: Date.now(),
              last_error: result.error || "Unknown error",
            }
          );

          res.json({
            success: false,
            error: result.error,
          });
        }
      } catch (error: any) {
        console.error("Error testing connection:", error);
        res.status(500).json({ error: error.message });
      }
    }
  );

  /**
   * DELETE /:clientId/config
   * Remove e-invoicing configuration
   */
  router.delete(
    "/:clientId/config",
    checkRole("USER"),
    checkClientRoles(["CLIENT_MANAGE"]),
    async (req, res) => {
      try {
        const ctx = Ctx.get(req)?.context;
        if (!ctx) throw new Error("No context");

        const db = await Framework.Db.getService();

        const configs = await db.select<EInvoicingConfig>(
          ctx,
          EInvoicingConfigDefinition.name,
          {
            client_id: ctx.client_id,
          },
          { limit: 1 }
        );

        const config = configs[0];
        if (!config) {
          return res.status(404).json({ error: "No configuration found" });
        }

        // Soft delete
        await remove(ctx, EInvoicingConfigDefinition.name, {
          id: config.id,
          client_id: ctx.client_id,
        });

        res.json({ success: true });
      } catch (error: any) {
        console.error("Error deleting e-invoicing config:", error);
        res.status(500).json({ error: error.message });
      }
    }
  );

  /**
   * PUT /:clientId/settings
   * Update receive_enabled / send_enabled settings
   */
  router.put(
    "/:clientId/settings",
    checkRole("USER"),
    checkClientRoles(["CLIENT_MANAGE"]),
    async (req, res) => {
      try {
        const ctx = Ctx.get(req)?.context;
        if (!ctx) throw new Error("No context");

        const { receive_enabled, send_enabled } = req.body;

        const db = await Framework.Db.getService();

        const configs = await db.select<EInvoicingConfig>(
          ctx,
          EInvoicingConfigDefinition.name,
          {
            client_id: ctx.client_id,
          },
          { limit: 1 }
        );

        const config = configs[0];
        if (!config) {
          return res.status(404).json({ error: "No configuration found" });
        }

        await db.update<EInvoicingConfig>(
          ctx,
          EInvoicingConfigDefinition.name,
          { id: config.id, client_id: ctx.client_id },
          {
            receive_enabled:
              receive_enabled !== undefined
                ? receive_enabled
                : config.receive_enabled,
            send_enabled:
              send_enabled !== undefined ? send_enabled : config.send_enabled,
          }
        );

        const updated = await db.selectOne<EInvoicingConfig>(
          ctx,
          EInvoicingConfigDefinition.name,
          { id: config.id, client_id: ctx.client_id }
        );

        res.json({ config: updated });
      } catch (error: any) {
        console.error("Error updating settings:", error);
        res.status(500).json({ error: error.message });
      }
    }
  );
};
