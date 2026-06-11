import Clients, {
  ClientsDefinition,
} from "#src/services/clients/entities/clients";
import { Context } from "#src/types";
import { captureException } from "@sentry/node";
import { getInvoiceNextDate, getNextReviewDate } from "@shared/invoices";
import { default as Framework } from "../../../../platform";
import { generateEmailMessageToRecipient } from "../../signing-sessions/services/utils";
import Invoices, { InvoicesDefinition } from "../entities/invoices";
import { generatePdf } from "../services/generate-pdf";
import { normalizeDate } from "../utils";
import { ensureRecipients } from "./recurring-generate-invoice";
import { update } from "#src/services/rest/services/rest";

/**
 * This trigger will set the state of the quote to "closed" when the recurring period ends
 * It can ends for the following reasons:
 * - A specific "delay" has been met
 * - A specific "date" has been crossed
 * - The recurring was manually stopped (changed to "closed"), we do nothing in this case, as we wont generate a new quote either
 *
 * Note: This must be executed *after* the invoice generation trigger because after this date, no more invoices will be generated
 *
 * Note 2: We will convert back to draft up to 1 month before the real end, if the minimal frequency and invoicing date allows it.
 *
 * Note 3: (!important) If we manually stopped the recurring quote, then we must *not* automatically re-create and sent quote
 */
export const checkQuotesThatMustEndRecurrence = async (ctx: Context) => {
  const db = await Framework.Db.getService();

  let offset = 0;
  const limit = 100;
  let quotes: Invoices[] = [];

  do {
    quotes = await db.select<Invoices>(
      ctx,
      InvoicesDefinition.name,
      {
        where: `type = $1 AND state = $2 AND subscription_ends_at < $3 AND is_deleted = false`,
        values: ["quotes", "recurring", Date.now() + 25 * 24 * 3600 * 1000], // We put 25 days here to be sure to catch all quotes that should end, even if the cron is a bit late, and to give a little bit of time to convert back to draft if needed
      },
      {
        limit,
        offset,
      }
    );

    for (const quote of quotes) {
      // Check if we can close the quote now
      let canClose = false;
      if (new Date(quote.subscription_ends_at || 0).getTime() <= Date.now()) {
        canClose = true;
      } else {
        // Check next invoice theorical date
        const nextDate = getInvoiceNextDate(quote);
        if (
          nextDate &&
          nextDate >= new Date(quote.subscription_ends_at || 0).getTime()
        ) {
          canClose = true;
        }
      }

      if (canClose) {
        await db.update<Invoices>(
          ctx,
          InvoicesDefinition.name,
          {
            id: quote.id,
          },
          {
            state: "closed",
          }
        );
      }
    }

    offset += limit;
  } while (quotes.length === 100);
};

export const setTriggerSetRecurrenceEndDate = () => {
  Framework.TriggersManager.registerTrigger<Invoices>(InvoicesDefinition, {
    name: "invoices-recurring-on-ended",
    test: (_, next, prev) => {
      return (
        next?.type === "quotes" &&
        next?.state !== "recurring" &&
        prev?.state === "recurring" &&
        (next.subscription?.renew_as === "draft" ||
          next.subscription?.renew_as === "sent")
      );
    },
    callback: async (ctx, quote) => {
      if (!quote) return;

      if (
        quote.subscription?.renew_as === "draft" ||
        quote.subscription?.renew_as === "sent"
      ) {
        const db = await Framework.Db.getService();
        await update(
          { ...ctx, client_id: quote.client_id, role: "SYSTEM" },
          InvoicesDefinition.name,
          {
            client_id: quote.client_id,
            id: quote.id,
          },
          {
            state: "draft",
            name: quote.name + " (renouvellement)",
            emit_date: new Date(), // We set the emit date to now to avoid any issue with next invoice date calculation and to be sure the quote is visible in the UI
            subscription_ends_at: null,
            subscription_next_invoice_date: null,
            subscription_started_at: null,
            wait_for_completion_since: null,
            recipients: [],
          }
        );
        const renewed = await db.selectOne<Invoices>(
          ctx,
          InvoicesDefinition.name,
          {
            client_id: quote.client_id,
            id: quote.id,
          }
        );

        if (!renewed?.id) {
          throw new Error("Failed to renew quote");
        }

        if (quote.subscription?.renew_as === "sent") {
          const client = await db.selectOne<Clients>(
            ctx,
            ClientsDefinition.name,
            {
              id: ctx.client_id,
            }
          );
          const recipients = await ensureRecipients(ctx, renewed);
          const { name, pdf } = await generatePdf(ctx, renewed);

          for (const recipient of recipients) {
            try {
              const { message, subject, htmlLogo } =
                await generateEmailMessageToRecipient(ctx, "sent", renewed, {
                  email: recipient.email,
                  role: "viewer",
                });
              await Framework.PushEMail.push(
                ctx,
                recipient.email,
                message,
                {
                  from: client?.company?.name || client?.company?.legal_name,
                  subject: subject,
                  attachments: [{ filename: name, content: pdf }],
                  logo: htmlLogo,
                },
                client.smtp
              );
            } catch (e: any) {
              console.error(
                "Error while sending the reminder for ",
                renewed.id,
                e
              );
              captureException(e);
            }
          }
        }
      }
    },
  });

  Framework.TriggersManager.registerTrigger<Invoices>(InvoicesDefinition, {
    name: "invoices-recurring-set-end-date",
    test: (_, next, prev) => {
      return (
        next?.type === "quotes" &&
        next?.content?.some((c) => c.subscription) &&
        (next?.subscription_started_at !== prev?.subscription_started_at ||
          next?.subscription?.end_type !== prev?.subscription?.end_type ||
          next?.subscription?.end_delay !== prev?.subscription?.end_delay ||
          next?.subscription?.end !== prev?.subscription?.end)
      );
    },
    callback: async (ctx, quote) => {
      if (!quote) return;

      const db = await Framework.Db.getService();

      let subscription_ends_at = quote.subscription_ends_at || null;
      // Set the subscription_ends_at value
      if (quote.subscription?.end_type === "date") {
        subscription_ends_at = new Date(quote.subscription.end || Date.now());
      } else if (quote.subscription?.end_type === "none") {
        subscription_ends_at = null;
      } else if (
        quote.subscription?.end_type === "delay" &&
        quote.subscription_started_at
      ) {
        const start_date = quote.subscription_started_at;
        const end_date = new Date(start_date);

        const value = parseInt(quote.subscription.end_delay || "0");
        const unit =
          quote.subscription.end_delay?.match(/[a-zA-Z]+/)?.[0] || "-";

        if (unit === "y") {
          end_date.setFullYear(end_date.getFullYear() + value);
        } else if (unit === "m") {
          end_date.setMonth(end_date.getMonth() + value);
        } else if (unit === "w") {
          end_date.setDate(end_date.getDate() + value * 7);
        } else if (unit === "d") {
          end_date.setDate(end_date.getDate() + value);
        } else {
          throw new Error(
            "Invalid unit for end_delay in subscription, we can't set a end date"
          );
        }

        const db = await Framework.Db.getService();
        const client = await db.selectOne<Clients>(
          ctx,
          ClientsDefinition.name,
          {
            id: quote.client_id,
          }
        );
        const timezone = client?.preferences?.timezone ?? "Europe/Paris";
        normalizeDate(end_date, timezone);
        subscription_ends_at = end_date;
      }

      const changes: Partial<Invoices> = {};
      if (subscription_ends_at !== quote.subscription_ends_at) {
        changes.subscription_ends_at = subscription_ends_at;
      }

      // When the quote becomes recurring, set a default "to review" reminder
      // if none has been configured yet: check once a year, at the start of the
      // last month of the recurrence. The user keeps full control afterwards.
      if (quote.state === "recurring" && !quote.review?.reminders?.length) {
        const endReference = subscription_ends_at
          ? new Date(subscription_ends_at)
          : quote.subscription_started_at
            ? new Date(quote.subscription_started_at)
            : new Date();
        const review = {
          enabled: true,
          reminders: [
            { day: "first", month: String(endReference.getMonth() + 1) },
          ],
        };
        const next = getNextReviewDate(review, Date.now());
        changes.review = review;
        changes.next_review_date = next ? new Date(next) : null;
      }

      if (Object.keys(changes).length) {
        await db.update<Invoices>(
          ctx,
          InvoicesDefinition.name,
          { id: quote.id },
          changes
        );
      }
    },
  });
};
