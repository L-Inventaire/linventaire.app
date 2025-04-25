import { Role } from "#src/services/clients/entities/clients-users";
import { checkRoles } from "#src/services/clients/services/client-roles";
import { Express, Router } from "express";
import { default as Framework, default as platform } from "../../../platform";
import { Logger } from "../../../platform/logger-db";
import { InternalApplicationService } from "../../types";
import InvoicesType, { InvoicesDefinition } from "./entities/invoices";
import { registerRoutes } from "./routes";
import { setCheckIsCompleteTrigger } from "./triggers/on-complete";
import { setOnCompletedCreateInvoicesTrigger } from "./triggers/on-completed-create-invoices";
import { setOnPaymentDelayChanged } from "./triggers/on-payment-delay-changed";
import { setOnPurchaseOrderTrigger } from "./triggers/on-purchase-order";
import {
  checkQuotesThatMustEndRecurrence,
  setTriggerSetRecurrenceEndDate,
} from "./triggers/recurring-end";
import {
  generateInvoicesForRecurringQuotes,
  setTriggerSetFirstNextInvoice,
} from "./triggers/recurring-generate-invoice";
import { setTriggerStartRecurring } from "./triggers/recurring-start";
import {
  checkReminders,
  setTriggerFirstReminderDate,
} from "./triggers/reminders";
import { setUpsertHook } from "./triggers/upsert-hook";
import { setNumetorationTrigger } from "./triggers/upsert-reference-number";
import { setStatusTrigger } from "./triggers/on-complete-status-change";

export default class Invoices implements InternalApplicationService {
  version = 1;
  name = "invoices";
  static logger: Logger;

  async init(server: Express) {
    const router = Router();
    registerRoutes(router);
    server.use(`/api/${this.name}/v${this.version}`, router);

    const db = await platform.Db.getService();
    await db.createTable(InvoicesDefinition);

    Invoices.logger = Framework.LoggerDb.get("invoices");

    /**
     * Invoices share the same entity but has different roles for access
     */
    Framework.TriggersManager.registerEntities(
      [InvoicesDefinition],
      async (ctx, entity: InvoicesType, action) => {
        const type = entity?.type;
        const clientId = entity?.client_id || ctx.client_id;
        if (!type) return true;
        if (type === "quotes") {
          return await checkRoles(ctx, clientId, [
            ("QUOTES_" + (action || "MANAGE")) as Role,
          ]);
        }
        if (type === "invoices" || type === "credit_notes") {
          return await checkRoles(ctx, clientId, [
            ("INVOICES_" + (action || "MANAGE")) as Role,
          ]);
        }
        if (type === "supplier_quotes") {
          return await checkRoles(ctx, clientId, [
            ("SUPPLIER_QUOTES_" + (action || "MANAGE")) as Role,
          ]);
        }
        if (type === "supplier_invoices" || type === "supplier_credit_notes") {
          return await checkRoles(ctx, clientId, [
            ("SUPPLIER_INVOICES_" + (action || "MANAGE")) as Role,
          ]);
        }
        return false;
      }
    );

    setUpsertHook();
    setNumetorationTrigger();
    setCheckIsCompleteTrigger();
    setOnPurchaseOrderTrigger();
    setOnPaymentDelayChanged();
    setOnCompletedCreateInvoicesTrigger();
    setStatusTrigger();

    // Manage recurring quotes
    setTriggerStartRecurring();
    setTriggerSetRecurrenceEndDate();
    setTriggerSetFirstNextInvoice();
    Framework.Cron.schedule(
      this.name + "-recurring-cron",
      "0 */10 * * * *", // Every 10 minutes
      async (ctx) => {
        await generateInvoicesForRecurringQuotes(ctx);
        await checkQuotesThatMustEndRecurrence(ctx);
      }
    );

    // Manage reminders for non supplier related documents
    setTriggerFirstReminderDate();
    Framework.Cron.schedule(
      this.name + "-reminder-cron",
      "0 0 15 * * *",
      async (ctx) => {
        await checkReminders(ctx);
      }
    );

    console.log(`${this.name}:v${this.version} initialized`);

    return this;
  }

  // Here will go the exported functions for other services
}
