import Framework from "#src/platform/index";
import {
  create,
  remove,
  search,
  update,
} from "#src/services/rest/services/rest";
import { Ctx } from "#src/services/utils";
import Services from "#src/services/index";
import { Router } from "express";
import { checkClientRoles, checkRole } from "../../common";
import {
  EInvoicingConfig,
  EInvoicingConfigDefinition,
} from "./entities/e-invoicing-config";
import { ReceivedEInvoice } from "./entities/received-e-invoice";
import { encrypt } from "./utils/encryption";

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
        const ctx = Ctx.get(req)!.context;
        if (!ctx) throw new Error("No context");

        const config = await Services.EInvoices.getConfig(ctx);

        if (!config) {
          return res.json({ config: null });
        }

        console.log("[GET /config] Config from DB:", {
          id: config.id,
          connection_status: config.connection_status,
          superpdp_company_id: config.superpdp_company_id,
          directory_entries_count:
            config.superpdp_directory_entries?.length || 0,
          directory_entries: config.superpdp_directory_entries,
        });

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
        const ctx = Ctx.get(req)!.context;
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
        const existingConfig = await Services.EInvoices.getConfig(ctx);

        let config;
        if (existingConfig) {
          // Update existing
          await update(
            ctx,
            EInvoicingConfigDefinition.name,
            { id: existingConfig.id, client_id: ctx.client_id },
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
            { id: existingConfig.id, client_id: ctx.client_id }
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
          config = await Services.EInvoices.getConfig(ctx);
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
        const ctx = Ctx.get(req)!.context;
        if (!ctx) throw new Error("No context");

        const db = await Framework.Db.getService();

        // Get config
        const config = await Services.EInvoices.getConfig(ctx);
        if (!config) {
          return res.status(404).json({
            error: "No configuration found. Please save configuration first.",
          });
        }

        // Get SuperPDP client (automatically decrypts credentials)
        const client = await Services.EInvoices.getClient(ctx);

        // Test connection
        const result = await client.testConnection();

        console.log("[POST /test-connection] Result from SuperPDP:", {
          success: result.success,
          company_id: result.company?.id,
          directory_entries_count: result.directoryEntries?.length || 0,
          directory_entries: result.directoryEntries,
        });

        if (result.success && result.company) {
          const directoryEntriesToSave = (result.directoryEntries || []).map(
            (entry) => ({
              ...entry,
              created_at: new Date(entry.created_at).getTime(),
            })
          );

          console.log(
            "[POST /test-connection] Saving directory entries:",
            directoryEntriesToSave
          );

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
              superpdp_directory_entries: directoryEntriesToSave,
              last_connection_test: Date.now(),
              last_error: "",
            }
          );

          console.log("[POST /test-connection] Config updated successfully");

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
        const ctx = Ctx.get(req)!.context;
        if (!ctx) throw new Error("No context");

        const db = await Framework.Db.getService();

        const config = await Services.EInvoices.getConfig(ctx);
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
        const ctx = Ctx.get(req)!.context;
        if (!ctx) throw new Error("No context");

        const { receive_enabled, send_enabled } = req.body;

        const db = await Framework.Db.getService();

        const config = await Services.EInvoices.getConfig(ctx);
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

  /**
   * POST /:clientId/sync
   * Sync company info and directory entries from SuperPDP
   */
  router.post(
    "/:clientId/sync",
    checkRole("USER"),
    checkClientRoles(["CLIENT_MANAGE"]),
    async (req, res) => {
      try {
        const ctx = Ctx.get(req)!.context;
        if (!ctx) throw new Error("No context");

        const db = await Framework.Db.getService();

        // Get config
        const config = await Services.EInvoices.getConfig(ctx);
        if (!config) {
          return res.status(404).json({ error: "No configuration found" });
        }

        if (config.connection_status !== "connected") {
          return res
            .status(400)
            .json({ error: "Configuration is not connected" });
        }

        // Get SuperPDP client (automatically decrypts credentials)
        const client = await Services.EInvoices.getClient(ctx);

        try {
          const company = await client.getCompanyInfo();
          const directoryEntries = await client.getDirectoryEntries();

          console.log("[POST /sync] Fetched fresh data from SuperPDP:", {
            company_id: company.id,
            directory_entries_count: directoryEntries.length,
            directory_entries: directoryEntries,
          });

          // Update config with fresh data
          await db.update<EInvoicingConfig>(
            ctx,
            EInvoicingConfigDefinition.name,
            { id: config.id, client_id: ctx.client_id },
            {
              superpdp_company_id: company.id,
              superpdp_company: {
                ...company,
                created_at: new Date(company.created_at).getTime(),
                mandates: (company.mandates || []).map((m) => ({
                  ...m,
                  created_at: new Date(m.created_at),
                })),
              },
              superpdp_directory_entries: directoryEntries.map((entry) => ({
                ...entry,
                created_at: new Date(entry.created_at).getTime(),
              })),
              last_connection_test: Date.now(),
            }
          );

          const updated = await db.selectOne<EInvoicingConfig>(
            ctx,
            EInvoicingConfigDefinition.name,
            { id: config.id, client_id: ctx.client_id }
          );

          console.log("[POST /sync] Config updated with fresh data");

          res.json({ success: true, config: updated });
        } catch (error: any) {
          console.error("[POST /sync] Error fetching from SuperPDP:", error);
          res.status(500).json({ error: `Failed to sync: ${error.message}` });
        }
      } catch (error: any) {
        console.error("Error syncing data:", error);
        res.status(500).json({ error: error.message });
      }
    }
  );

  /**
   * GET /:clientId/received
   * Get received e-invoices
   */
  router.get(
    "/:clientId/received",
    checkRole("USER"),
    checkClientRoles(["SUPPLIER_INVOICES_READ"]),
    async (req, res) => {
      try {
        const ctx = Ctx.get(req)!.context;
        if (!ctx) throw new Error("No context");

        const db = await Framework.Db.getService();

        // Check if e-invoicing is enabled for receiving
        const config = await Services.EInvoices.getConfig(ctx);
        if (!config || !config.receive_enabled) {
          return res.status(403).json({
            error: "E-invoicing reception is not enabled for this client",
          });
        }

        // Get received invoices
        const { limit = 100, offset = 0 } = req.query;
        const invoices = await db.select(
          ctx,
          "received_e_invoices",
          {
            client_id: ctx.client_id,
          },
          {
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            index: "received_at desc",
          }
        );

        const count = await db.count(ctx, "received_e_invoices", {
          client_id: ctx.client_id,
        });

        res.json({
          data: invoices,
          total: count,
        });
      } catch (error: any) {
        console.error("Error fetching received e-invoices:", error);
        res.status(500).json({ error: error.message });
      }
    }
  );

  /**
   * GET /:clientId/received/:id/matched-entities
   * Get matched entities (contacts, articles) for a received e-invoice
   */
  router.get(
    "/:clientId/received/:id/matched-entities",
    checkRole("USER"),
    checkClientRoles(["SUPPLIER_INVOICES_READ"]),
    async (req, res) => {
      try {
        const ctx = Ctx.get(req)!.context;
        if (!ctx) throw new Error("No context");

        const { id } = req.params;
        const db = await Framework.Db.getService();

        // Get the received invoice
        const receivedInvoice = await db.selectOne<ReceivedEInvoice>(
          ctx,
          "received_e_invoices",
          {
            id,
            client_id: ctx.client_id,
          }
        );

        if (!receivedInvoice) {
          return res.status(404).json({ error: "Received invoice not found" });
        }

        // Extract references from EN16931 invoice
        const { extractReferencesFromEN16931 } = await import(
          "./services/invoice-converter"
        );
        const references = extractReferencesFromEN16931(
          receivedInvoice.en_invoice
        );

        // Find matching supplier contact
        const supplierMatches = await search(
          { ...ctx, role: "SYSTEM" },
          "contacts",
          {
            client_id: ctx.client_id,
            business_registered_id:
              references.seller.legal_registration_identifier.value,
          }
        );

        // Find matching articles/services
        const articleMatches = new Map();
        for (const articleRef of references.articles) {
          const matches = await search({ ...ctx, role: "SYSTEM" }, "articles", {
            client_id: ctx.client_id,
            reference: [
              articleRef.sellers_item_identification,
              articleRef.buyers_item_identification,
            ],
          });

          if (matches.list.length > 0) {
            articleMatches.set(articleRef.name, matches.list);
          }
        }

        res.json({
          supplier: supplierMatches.list?.[0] || null,
          articles: Object.fromEntries(articleMatches),
          references,
        });
      } catch (error: any) {
        console.error("Error finding matched entities:", error);
        res.status(500).json({ error: error.message });
      }
    }
  );
};
