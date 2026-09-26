import Framework from "#src/platform/index";
import Services from "#src/services/index";
import { remove, search } from "#src/services/rest/services/rest";
import { Ctx } from "#src/services/utils";
import { Router } from "express";
import { checkClientRoles, checkRole } from "../../common";
import { ArticlesDefinition } from "../articles/entities/articles";
import Contacts, { ContactsDefinition } from "../contacts/entities/contacts";
import {
  EInvoicingConfig,
  EInvoicingConfigDefinition,
} from "./entities/e-invoicing-config";
import { ReceivedEInvoice } from "./entities/received-e-invoice";
import nodeConfig from "config";

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

        res.json({ config: sanitizeConfig(config) });
      } catch (error: any) {
        console.error("Error fetching e-invoicing config:", error);
        res.status(500).json({ error: error.message });
      }
    }
  );

  /**
   * POST /:clientId/superpdp/authorize
   * Start the SuperPDP onboarding (account, KYC/KYB, consent) and return the
   * URL to redirect the user to
   */
  router.post(
    "/:clientId/superpdp/authorize",
    checkRole("USER"),
    checkClientRoles(["CLIENT_MANAGE"]),
    async (req, res) => {
      try {
        const ctx = Ctx.get(req)!.context;
        if (!ctx) throw new Error("No context");

        const url = await Services.EInvoices.startAuthorization(ctx);

        res.json({ url });
      } catch (error: any) {
        console.error("Error starting SuperPDP authorization:", error);
        res.status(500).json({ error: error.message });
      }
    }
  );

  /**
   * GET /superpdp/callback
   * Redirect URI registered at SuperPDP. Public: the user comes back from
   * SuperPDP's hosted pages, the state authenticates the request.
   */
  router.get("/superpdp/callback", async (req, res) => {
    const { code, state, error, error_description } = req.query as Record<
      string,
      string | undefined
    >;
    const clientId = (state || "").split(".")[0];
    const redirect = (params: Record<string, string>) => {
      const url = new URL(
        `${nodeConfig
          .get<string>("server.domain")
          .replace(/\/$/, "")}/${encodeURIComponent(
          clientId
        )}/settings/e-invoicing`
      );
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
      res.redirect(url.toString());
    };

    if (error || !code || !state) {
      return redirect({
        superpdp: "error",
        message: error_description || error || "Autorisation annulée",
      });
    }

    try {
      await Services.EInvoices.completeAuthorization(state, code);
      redirect({ superpdp: "success" });
    } catch (e: any) {
      console.error("Error completing SuperPDP authorization:", e);
      redirect({ superpdp: "error", message: e.message });
    }
  });

  /**
   * POST /:clientId/test-connection
   * Check the connection to SuperPDP (verification status, company info and
   * directory entries)
   */
  router.post(
    "/:clientId/test-connection",
    checkRole("USER"),
    checkClientRoles(["CLIENT_MANAGE"]),
    async (req, res) => {
      try {
        const ctx = Ctx.get(req)!.context;
        if (!ctx) throw new Error("No context");

        const config = await Services.EInvoices.getConfig(ctx);
        if (!config) {
          return res.status(404).json({ error: "No configuration found" });
        }

        const updated = await Services.EInvoices.refreshConnection(ctx);

        res.json({
          success: updated?.connection_status !== "error",
          status: updated?.connection_status,
          company: updated?.superpdp_company,
          error: updated?.last_error || undefined,
        });
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

        res.json({ config: sanitizeConfig(updated) });
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

        const updated = await Services.EInvoices.refreshConnection(ctx);
        if (updated?.connection_status === "error") {
          return res
            .status(500)
            .json({ error: `Failed to sync: ${updated.last_error}` });
        }

        res.json({ success: true, config: sanitizeConfig(updated) });
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

  /**
   * POST /:clientId/received/:id/convert
   * Convert a received e-invoice to a supplier invoice
   */
  router.post(
    "/:clientId/received/:id/convert",
    checkRole("USER"),
    checkClientRoles(["SUPPLIER_INVOICES_WRITE"]),
    async (req, res) => {
      try {
        const ctx = Ctx.get(req)!.context;
        if (!ctx) throw new Error("No context");

        const { id } = req.params;
        const { supplier_id, article_mappings } = req.body;
        const db = await Framework.Db.getService();

        // Validate supplier_id is provided
        if (!supplier_id) {
          return res.status(400).json({
            error: "supplier_id is required",
          });
        }

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

        if (receivedInvoice.state !== "new") {
          return res.status(400).json({
            error: "Invoice has already been processed",
          });
        }

        // Get the supplier contact
        const supplier = await db.selectOne<Contacts>(
          ctx,
          ContactsDefinition.name,
          {
            id: supplier_id,
            client_id: ctx.client_id,
          }
        );

        if (!supplier) {
          return res.status(400).json({
            error: "Supplier contact not found",
          });
        }

        // Validate supplier business_registered_id matches invoice
        const sellerRegistrationId =
          receivedInvoice.en_invoice?.seller?.legal_registration_identifier
            ?.value;
        if (
          sellerRegistrationId &&
          supplier.business_registered_id !== sellerRegistrationId
        ) {
          return res.status(400).json({
            error:
              "Supplier business registration ID does not match invoice seller registration ID",
            expected: sellerRegistrationId,
            actual: supplier.business_registered_id,
          });
        }

        // Extract references and find matching articles
        const { convertEN16931ToInternal } = await import(
          "./services/invoice-converter"
        );

        // Build article matches map from provided article_mappings
        const articleMatches = new Map();
        if (article_mappings && typeof article_mappings === "object") {
          // article_mappings is { line_number: article_id }
          for (const [lineNumber, articleId] of Object.entries(
            article_mappings
          )) {
            if (articleId && typeof articleId === "string") {
              const article = await db.selectOne(ctx, ArticlesDefinition.name, {
                id: articleId as string,
                client_id: ctx.client_id,
              });

              if (article) {
                // Find the corresponding line in the invoice
                const invoiceLine = receivedInvoice.en_invoice?.lines?.find(
                  (line) => line.identifier === lineNumber
                );

                if (invoiceLine) {
                  articleMatches.set(
                    invoiceLine.item_information.name,
                    article
                  );
                }
              }
            }
          }
        }

        // Get client info
        const client = await Services.Clients.getClient(ctx, ctx.client_id);
        if (!client) {
          throw new Error("Client not found");
        }

        // Convert EN16931 to internal format
        const resolvedEntities = {
          supplier,
          articles: articleMatches,
          self: client,
        };

        const internalInvoice = convertEN16931ToInternal(
          receivedInvoice.en_invoice,
          resolvedEntities,
          "in",
          ctx
        );

        res.json({
          success: true,
          invoice: internalInvoice,
        });
      } catch (error: any) {
        console.error("Error converting e-invoice:", error);
        res.status(500).json({ error: error.message });
      }
    }
  );
};

// Don't send encrypted secrets to frontend
const sanitizeConfig = (config: EInvoicingConfig | null) =>
  config && {
    ...config,
    integration_client_secret_encrypted:
      config.integration_client_secret_encrypted ? "***" : "",
    access_token_encrypted: config.access_token_encrypted ? "***" : "",
    refresh_token_encrypted: config.refresh_token_encrypted ? "***" : "",
    oauth_code_verifier_encrypted: "",
    oauth_state: "",
  };
