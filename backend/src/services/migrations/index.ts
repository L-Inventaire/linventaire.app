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
    await db.createTable(MigrationsDefinition);

    const migrations = {
      "001-create-accounting-accounts": createAccountingAccounts,
      "002-mark-all-as-not-deleted": markAllAsNotDeleted,
      "003-recompute-completions": recomputeAllCompletionStatus,
      "004-drop-searchable-column": dropSearchableTsVectorColumn,
      "005-set-invoices-caches-4": setCacheInvoices,
      "006-move-articles-references": moveArticleReferences,
      "007-better-search-stock-services-redo-2": betterSearchStockServices,
      "008-fix-payment-date-invoices-redo-2": fixPaymentDatesInvoices,
      "009-fix-invoices-searchable-1": fixInvoicesSearchables,
      "010-contact-rebuild-searchable": rebuildContactSearchables,
      "011-stock-reindex-searchable": rebuildStockSearchables,
      "012-notifications-fix-searchable-redo": fixNotificationsSearchables,
      "013-a-contact-rebuild-searchable": rebuildContactSearchables,
      "013-b-stock-reindex-searchable": rebuildStockSearchables,
      "013-c-articles-reindex-searchable": rebuildArticlesSearchables,
    } as {
      [key: string]: (ctx: Context) => Promise<void>;
    };

    const orderedMigrationsKeys = Object.keys(migrations).sort();
    const ctx = createContext();

    for (const k of orderedMigrationsKeys) {
      // Check if the migration has already been run
      const migration = await db.selectOne<any>(
        ctx,
        MigrationsDefinition.name,
        { id: k }
      );
      if (!migration) {
        migrating = k;
        this.logger.info(ctx, `[migration] Running migration ${k}`);
        try {
          // Run the migration
          await migrations[k](ctx);
          // Save the migration as run
          await db.insert(ctx, MigrationsDefinition.name, { id: k });
          this.logger.info(ctx, `[migration] Migration ${k} done`);
        } catch (e) {
          captureException(e);
          this.logger.error(ctx, `[migration] Migration ${k} failed: ${e}`);
        }
      } else {
        this.logger.info(ctx, `[migration] Migration ${k} already run`);
      }
    }

    clearTimeout(tooMuchTimeTimeout);

    console.log(`${this.name}:v${this.version} initialized`);
    return this;
  }
}
