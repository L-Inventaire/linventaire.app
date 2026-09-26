import Framework from "#src/platform/index";
import { Context, createContext } from "#src/types";
import { captureException } from "@sentry/node";
import { Express } from "express";
import { Logger } from "../../platform/logger-db";
import { InternalApplicationService } from "../types";
import { MigrationsDefinition } from "./entities/migrations";
import { createAccountingAccounts } from "./migrations/001-create-accounting-accounts";
import { markAllAsNotDeleted } from "./migrations/002-mark-all-as-not-deleted";
import { recomputeAllCompletionStatus } from "./migrations/003-recompute-completions";
import { dropSearchableTsVectorColumn } from "./migrations/004-drop-searchable-column";
import { setCacheInvoices } from "./migrations/005-set-invoices-caches";
import { moveArticleReferences } from "./migrations/006-move-articles-references";
import { betterSearchStockServices } from "./migrations/007-better-search-stock-services";
import { fixPaymentDatesInvoices } from "./migrations/008-fix-payment-date-invoices";
import { fixInvoicesSearchables } from "./migrations/009-invoice-fix-searchable";
import { rebuildContactSearchables } from "./migrations/010-contact-rebuild-searchable";
import { rebuildStockSearchables } from "./migrations/011-stock-reindex-searchable";
import { fixNotificationsSearchables } from "./migrations/012-notifications-fix-searchable";
import { rebuildArticlesSearchables } from "./migrations/013-articles-reindex-searchable";
import { convertUnitsToStandardCodes } from "./migrations/014-convert-units-to-standard-codes";
import { convertVatExemptionsToStandardCodes } from "./migrations/015-convert-vat-exemptions-to-standard-codes";
import { convertVatToStandardCodes } from "./migrations/016-convert-vat-to-standard-codes";
import { normalizeContactCountryCodes } from "./migrations/017-normalize-contact-country-codes";
import { reindexArticlesStockNumericPrefixes } from "./migrations/018-reindex-articles-stock-numeric-prefixes";
import { setSubscriptionsReview } from "./migrations/019-set-subscriptions-review";
import { reencryptEInvoicingCredentials } from "./migrations/020-reencrypt-einvoicing-credentials";

export default class Clients implements InternalApplicationService {
  version = 1;
  name = "migrations";
  private logger: Logger;

  async init(_server: Express) {
    this.logger = Framework.LoggerDb.get("migrations");

    let counter = 0;
    let migrating = "";

    const tooMuchTimeTimeout = setInterval(() => {
      counter++;
      captureException(
        new Error(
          "Migrations took too much time to run (>15min) ! Still running " +
            migrating +
            "..."
        )
      );
      if (counter > 100) {
        clearInterval(tooMuchTimeTimeout);
        captureException(
          new Error(
            "Migrations took too much time to run (>1500min) ! Still running " +
              migrating +
              " in background..."
          )
        );
      }
    }, 1000 * 60 * 15);

    const db = await Framework.Db.getService();
    const ctx = createContext();
    await db.createTable(MigrationsDefinition);

    // Serialize migrations across instances with a Postgres advisory lock so
    // that multiple booting instances (e.g. several ECS tasks) never run
    // migrations concurrently. We use a non-blocking try-lock polled at the
    // application level rather than a blocking pg_advisory_lock, because the
    // driver runs custom() on a single shared connection and a blocking wait
    // there would stall every other query on that connection during startup.
    const MIGRATIONS_LOCK_KEY = 918273645;
    const acquireLock = async (): Promise<boolean> => {
      const r = await db.custom<{ rows: { ok: boolean }[] }>(
        ctx,
        "SELECT pg_try_advisory_lock($1) AS ok",
        [MIGRATIONS_LOCK_KEY]
      );
      return r?.rows?.[0]?.ok === true;
    };

    let locked = false;
    for (let attempt = 0; attempt < 150 && !locked; attempt++) {
      locked = await acquireLock();
      if (!locked) {
        this.logger.info(
          ctx,
          "[migration] Another instance holds the migrations lock, waiting..."
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
    if (!locked) {
      clearInterval(tooMuchTimeTimeout);
      throw new Error(
        "Could not acquire the migrations advisory lock after 5 minutes"
      );
    }

    const migrations = {
      "001-create-accounting-accounts": createAccountingAccounts,
      "002-mark-all-as-not-deleted": markAllAsNotDeleted,
      "003-recompute-completions": recomputeAllCompletionStatus,
      "004-drop-searchable-column": dropSearchableTsVectorColumn,
      "005-set-invoices-caches-4": setCacheInvoices,
      "006-move-articles-references": moveArticleReferences,
      "007-better-search-stock-services-redo-2": betterSearchStockServices,
      "008-fix-payment-date-invoices-redo-2": fixPaymentDatesInvoices,
      "009-fix-invoices-searchable-2": fixInvoicesSearchables,
      "010-contact-rebuild-searchable": rebuildContactSearchables,
      "011-stock-reindex-searchable": rebuildStockSearchables,
      "012-notifications-fix-searchable-redo": fixNotificationsSearchables,
      "013-a2-contact-rebuild-searchable": rebuildContactSearchables,
      "013-b-stock-reindex-searchable": rebuildStockSearchables,
      "013-c-articles-reindex-searchable": rebuildArticlesSearchables,
      "014-convert-units-to-standard-codes": convertUnitsToStandardCodes,
      "015-convert-vat-exemptions-to-standard-codes":
        convertVatExemptionsToStandardCodes,
      "016-convert-vat-to-standard-codes": convertVatToStandardCodes,
      "017-normalize-contact-country-codes": normalizeContactCountryCodes,
      "018-reindex-articles-stock-numeric-prefixes": reindexArticlesStockNumericPrefixes,
      "019-set-subscriptions-review": setSubscriptionsReview,
      "020-reencrypt-einvoicing-credentials": reencryptEInvoicingCredentials,
    } as {
      [key: string]: (ctx: Context) => Promise<void>;
    };

    const orderedMigrationsKeys = Object.keys(migrations).sort();

    try {
      for (const k of orderedMigrationsKeys) {
        // Check if the migration has already been run
        const migration = await db.selectOne<any>(
          ctx,
          MigrationsDefinition.name,
          { id: k }
        );
        if (migration) {
          this.logger.info(ctx, `[migration] Migration ${k} already run`);
          continue;
        }

        migrating = k;
        this.logger.info(ctx, `[migration] Running migration ${k}`);
        try {
          // Run the migration and record it as done atomically: if the
          // migration throws, the transaction rolls back and the "done"
          // marker is not persisted, so it can be retried on the next boot.
          await db.transaction(ctx, async (tctx) => {
            await migrations[k](tctx);
            await db.insert(tctx, MigrationsDefinition.name, { id: k });
          });
          this.logger.info(ctx, `[migration] Migration ${k} done`);
        } catch (e: any) {
          captureException(e);
          this.logger.error(ctx, `[migration] Migration ${k} failed: ${e}`);
          // Stop the whole boot: continuing past a failed migration risks
          // running the app against a half-migrated schema.
          throw new Error(`Migration ${k} failed: ${e?.message || e}`);
        }
      }
    } finally {
      clearInterval(tooMuchTimeTimeout);
      try {
        await db.custom(ctx, "SELECT pg_advisory_unlock($1)", [
          MIGRATIONS_LOCK_KEY,
        ]);
      } catch (e: any) {
        this.logger.error(
          ctx,
          `[migration] Failed to release migrations lock: ${e?.message || e}`
        );
      }
    }

    console.log(`${this.name}:v${this.version} initialized`);
    return this;
  }
}
