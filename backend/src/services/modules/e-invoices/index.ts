import { Express, Router } from "express";
import { default as Framework } from "../../../platform/index";
import { Logger } from "../../../platform/logger-db";
import { InternalApplicationService } from "../../types";
import { Context, createContext } from "../../../types";
import registerRoutes from "./routes";
import {
  EInvoicingConfig,
  EInvoicingConfigDefinition,
} from "./entities/e-invoicing-config";
import { ReceivedEInvoiceDefinition } from "./entities/received-e-invoice";
import { setupCronReceivedInvoices } from "./services/received-invoices-cron";
import { decrypt, encrypt } from "./utils/encryption";
import {
  SuperPDPClient,
  SuperPDPTokenSet,
} from "../../../platform/e-invoices/adapters/superpdp/client";
import Services from "#src/services/index";
import { create } from "#src/services/rest/services/rest";
import config from "config";
import crypto from "crypto";

export default class EInvoicesService implements InternalApplicationService {
  version = 1;
  name = "e-invoices";
  static logger: Logger;

  async init(server: Express) {
    const router = Router();
    registerRoutes(router);
    server.use(`/api/${this.name}/v${this.version}`, router);

    // Create database tables
    const db = await Framework.Db.getService();
    await db.createTable(EInvoicingConfigDefinition);
    await db.createTable(ReceivedEInvoiceDefinition);

    // Register entities with access control
    Framework.TriggersManager.registerEntities([EInvoicingConfigDefinition], {
      READ: "CLIENT_MANAGE",
      WRITE: "CLIENT_MANAGE",
      MANAGE: "CLIENT_MANAGE",
    });

    Framework.TriggersManager.registerEntities([ReceivedEInvoiceDefinition], {
      READ: "SUPPLIER_INVOICES_READ",
      WRITE: "SUPPLIER_INVOICES_WRITE",
      MANAGE: "SUPPLIER_INVOICES_WRITE",
    });

    EInvoicesService.logger = Framework.LoggerDb.get("e-invoices");

    // Setup cron job for fetching received invoices
    await setupCronReceivedInvoices();

    console.log(`${this.name}:v${this.version} initialized`);

    return this;
  }

  /**
   * Get e-invoicing configuration for a client
   *
   * @param ctx - Context with client_id
   * @returns EInvoicingConfig or null if not found
   */
  async getConfig(ctx: Context): Promise<EInvoicingConfig | null> {
    const db = await Framework.Db.getService();

    const configs = await db.select<EInvoicingConfig>(
      ctx,
      EInvoicingConfigDefinition.name,
      {
        client_id: ctx.client_id,
      },
      { limit: 1 }
    );

    return configs[0] || null;
  }

  /**
   * Get a configured SuperPDP client for the given context
   * Uses the OAuth tokens obtained through the SuperPDP onboarding, or the
   * legacy manually entered credentials for older configurations.
   *
   * @param ctx - Context with client_id
   * @returns SuperPDPClient instance
   * @throws Error if configuration not found or credentials cannot be decrypted
   */
  async getClient(ctx: Context): Promise<SuperPDPClient> {
    // Get config for this client
    const config = await this.getConfig(ctx);
    if (!config) {
      throw new Error(
        `E-invoicing configuration not found for client ${ctx.client_id}`
      );
    }

    if (config.refresh_token_encrypted) {
      const app = getSuperPDPAppCredentials();
      return Framework.EInvoices.getClient({
        clientId: app.clientId,
        clientSecret: app.clientSecret,
        tokenProvider: (staleToken) => this.getAccessToken(ctx, staleToken),
      });
    }

    // Decrypt credentials
    const clientSecret = decrypt(config.integration_client_secret_encrypted);
    if (!clientSecret) {
      throw new Error(
        `Failed to decrypt client secret for client ${ctx.client_id}`
      );
    }

    // Create and return SuperPDP client
    return Framework.EInvoices.getClient({
      clientId: config.integration_client_id,
      clientSecret,
    });
  }

  /**
   * Start the SuperPDP onboarding (OAuth2 authorization_code + PKCE).
   * SuperPDP handles account creation, KYC/KYB and consent, then redirects to
   * our callback.
   *
   * @returns URL to redirect the user to
   */
  async startAuthorization(ctx: Context): Promise<string> {
    const app = getSuperPDPAppCredentials();
    const db = await Framework.Db.getService();

    const pkce = SuperPDPClient.createPkcePair();
    // The client id is carried in the state so the public callback can find the config
    const state = `${ctx.client_id}.${crypto.randomBytes(24).toString("hex")}`;

    const pending: Partial<EInvoicingConfig> = {
      oauth_state: state,
      oauth_code_verifier_encrypted: encrypt(pkce.verifier),
      oauth_started_at: Date.now(),
    };

    const existingConfig = await this.getConfig(ctx);
    if (existingConfig) {
      await db.update<EInvoicingConfig>(
        ctx,
        EInvoicingConfigDefinition.name,
        { id: existingConfig.id, client_id: ctx.client_id },
        pending
      );
    } else {
      await create(ctx, EInvoicingConfigDefinition.name, {
        ...pending,
        pdp_provider: "superpdp",
        connection_status: "not_configured",
        receive_enabled: false,
        send_enabled: false,
      });
    }

    // Prefill the onboarding with what we already know
    const client = await Services.Clients.getClient(ctx, ctx.client_id);
    const siren = (client?.company?.registration_number || "")
      .replace(/\s/g, "")
      .slice(0, 9);
    const user = ctx.id
      ? await Services.Users.getUser(ctx, { id: ctx.id }).catch(() => null)
      : null;

    return SuperPDPClient.getAuthorizeUrl({
      clientId: app.clientId,
      redirectUri: app.redirectUri,
      codeChallenge: pkce.challenge,
      state,
      loginHint: user?.id_email || undefined,
      companyNumber: /^\d{9}$/.test(siren) ? siren : undefined,
    });
  }

  /**
   * Handle the redirection from SuperPDP: check the state, exchange the code
   * and store the tokens.
   *
   * @returns the client id the authorization was started for
   */
  async completeAuthorization(
    state: string,
    code: string
  ): Promise<{ clientId: string }> {
    const app = getSuperPDPAppCredentials();
    const db = await Framework.Db.getService();

    const clientId = (state || "").split(".")[0];
    if (!clientId) throw new Error("Invalid state");
    const ctx = {
      ...createContext("e-invoices", "SYSTEM"),
      client_id: clientId,
    };

    const config = await this.getConfig(ctx);
    if (
      !config?.oauth_state ||
      !safeEqual(config.oauth_state, state) ||
      Date.now() - (config.oauth_started_at || 0) > OAUTH_STATE_TTL
    ) {
      throw new Error("Invalid or expired authorization request");
    }

    const tokens = await SuperPDPClient.requestToken(
      {
        grant_type: "authorization_code",
        code,
        code_verifier: decrypt(config.oauth_code_verifier_encrypted),
        redirect_uri: app.redirectUri,
      },
      app
    );

    await db.update<EInvoicingConfig>(
      ctx,
      EInvoicingConfigDefinition.name,
      { id: config.id, client_id: clientId },
      {
        ...tokenFields(tokens),
        // Drop legacy manual credentials, the OAuth tokens replace them
        integration_client_id: "",
        integration_client_secret_encrypted: "",
        oauth_state: "",
        oauth_code_verifier_encrypted: "",
        oauth_started_at: 0,
        connection_status: "pending_verification",
        last_error: "",
      }
    );

    await this.refreshConnection(ctx);

    return { clientId };
  }

  /**
   * Get a valid access token for the client, refreshing it when needed.
   * Refresh tokens rotate, so refreshes are serialized with a lock and the
   * config is re-read to reuse a token another process just obtained.
   *
   * @param staleToken - token that was just rejected by SuperPDP, if any
   */
  async getAccessToken(ctx: Context, staleToken?: string): Promise<string> {
    const usableToken = (config: EInvoicingConfig | null) => {
      const token = decrypt(config?.access_token_encrypted || "");
      if (
        token &&
        token !== staleToken &&
        (config?.token_expires_at || 0) - TOKEN_EXPIRY_SKEW > Date.now()
      ) {
        return token;
      }
      return null;
    };

    const current = usableToken(await this.getConfig(ctx));
    if (current) return current;

    const lockKey = `e-invoices-superpdp-refresh-${ctx.client_id}`;
    let lockId: string | null = null;
    for (let i = 0; i < 30 && !lockId; i++) {
      lockId = await Framework.Lock.acquire(ctx, lockKey, 30000);
      if (!lockId) await new Promise((r) => setTimeout(r, 500));
    }
    if (!lockId) throw new Error("SuperPDP token refresh already in progress");

    try {
      const config = await this.getConfig(ctx);
      const refreshed = usableToken(config);
      if (refreshed) return refreshed;

      const refreshToken = decrypt(config?.refresh_token_encrypted || "");
      if (!config || !refreshToken) {
        throw new Error("SuperPDP n'est pas connecté pour ce client");
      }

      const db = await Framework.Db.getService();
      try {
        const tokens = await SuperPDPClient.requestToken(
          { grant_type: "refresh_token", refresh_token: refreshToken },
          getSuperPDPAppCredentials()
        );
        await db.update<EInvoicingConfig>(
          ctx,
          EInvoicingConfigDefinition.name,
          { id: config.id, client_id: ctx.client_id },
          // Keep the previous refresh token if none was returned
          tokenFields({ refresh_token: refreshToken, ...tokens })
        );
        return tokens.access_token;
      } catch (error: any) {
        await db.update<EInvoicingConfig>(
          ctx,
          EInvoicingConfigDefinition.name,
          { id: config.id, client_id: ctx.client_id },
          {
            connection_status: "error",
            last_error: `Reconnexion à SuperPDP nécessaire : ${error.message}`,
          }
        );
        throw error;
      }
    } finally {
      await Framework.Lock.release(ctx, lockId);
    }
  }

  /**
   * Fetch the verification status, company info and directory entries from
   * SuperPDP and store them on the config.
   */
  async refreshConnection(ctx: Context): Promise<EInvoicingConfig | null> {
    const db = await Framework.Db.getService();
    const config = await this.getConfig(ctx);
    if (!config) throw new Error("No configuration found");

    const client = await this.getClient(ctx);
    const where = { id: config.id, client_id: ctx.client_id };

    try {
      if (config.refresh_token_encrypted) {
        const session = await client.getSession();
        if (session.company_verification_status !== "verified") {
          await db.update<EInvoicingConfig>(
            ctx,
            EInvoicingConfigDefinition.name,
            where,
            {
              connection_status: "pending_verification",
              company_verification_status:
                session.company_verification_status || "",
              last_connection_test: Date.now(),
              last_error: "",
            }
          );
          return await this.getConfig(ctx);
        }
      }

      const company = await client.getCompanyInfo();
      const directoryEntries = await client.getDirectoryEntries();

      await db.update<EInvoicingConfig>(
        ctx,
        EInvoicingConfigDefinition.name,
        where,
        {
          connection_status: "connected",
          company_verification_status: "verified",
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
          last_error: "",
        }
      );
    } catch (error: any) {
      await db.update<EInvoicingConfig>(
        ctx,
        EInvoicingConfigDefinition.name,
        where,
        {
          connection_status: "error",
          last_connection_test: Date.now(),
          last_error: error.message || "Unknown error",
        }
      );
    }

    return await this.getConfig(ctx);
  }
}

// Pending authorization requests expire after 1 hour (KYC can take a while)
const OAUTH_STATE_TTL = 60 * 60 * 1000;
// Refresh access tokens a bit before they actually expire
const TOKEN_EXPIRY_SKEW = 60 * 1000;

/**
 * Credentials of the l'inventaire application registered at SuperPDP
 */
export const getSuperPDPAppCredentials = () => {
  const clientId = config.get<string>("e_invoicing.superpdp.client_id");
  const clientSecret = config.get<string>("e_invoicing.superpdp.client_secret");
  if (!clientId || !clientSecret) {
    throw new Error(
      "SuperPDP n'est pas configuré sur ce serveur (e_invoicing.superpdp)"
    );
  }
  const redirectUri =
    config.get<string>("e_invoicing.superpdp.redirect_uri") ||
    `${config
      .get<string>("server.api")
      .replace(/\/$/, "")}/api/e-invoices/v1/superpdp/callback`;
  return { clientId, clientSecret, redirectUri };
};

const tokenFields = (tokens: SuperPDPTokenSet): Partial<EInvoicingConfig> => ({
  access_token_encrypted: encrypt(tokens.access_token),
  refresh_token_encrypted: encrypt(tokens.refresh_token || ""),
  // SuperPDP access tokens last ~30 minutes when expires_in is missing
  token_expires_at: Date.now() + (tokens.expires_in || 30 * 60) * 1000,
});

const safeEqual = (a: string, b: string) => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};
