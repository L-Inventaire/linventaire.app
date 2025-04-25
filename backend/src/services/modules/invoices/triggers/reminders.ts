import Framework from "#src/platform/index";
import Clients, {
  ClientsDefinition,
} from "#src/services/clients/entities/clients";
import { Context } from "#src/types";
import { captureException } from "@sentry/node";
import { generateEmailMessageToRecipient } from "../../signing-sessions/services/utils";
import Invoices, { InvoicesDefinition } from "../entities/invoices";
import { generatePdf } from "../services/generate-pdf";
import { normalizeDate } from "../utils";

const reminderDefaultDelayInDays = 7;

/**
 * This function will open all the invoices, and quotes that have a reminder set for today or before today.
 * Then it will set the date for the next reminder.
 */
export const checkReminders = async (ctx: Context) => {
  const db = await Framework.Db.getService();

  const next_reminder = new Date();
  next_reminder.setDate(next_reminder.getDate() + reminderDefaultDelayInDays);
  normalizeDate(next_reminder, "UTC");

  let offset = 0;
  const limit = 100;
  let docs: Invoices[] = [];

  do {
    docs = await db.select<Invoices>(
      ctx,
      InvoicesDefinition.name,
      {
        where: `type = $1 AND state = $2 AND next_reminder < $3 AND next_reminder > 0 AND reminder_count < 3 AND is_deleted = false`,
        values: ["quotes", "sent", Date.now()],
      },
      {
        limit,
        offset,
      }
    );

    for (const doc of docs) {
      try {
        next_reminder.setDate(
          next_reminder.getDate() + reminderDefaultDelayInDays
        );
        await db.update<Invoices>(
          ctx,
          InvoicesDefinition.name,
          {
            id: doc.id,
          },
          {
            next_reminder,
            reminder_count: (doc.reminder_count || 0) + 1,
          }
        );

        const client = await db.selectOne<Clients>(
          ctx,
          ClientsDefinition.name,
          { id: doc.client_id }
        );

        if (doc.recipients.length) {
          const { name, pdf } = await generatePdf(ctx, doc);

          for (const recipient of doc.recipients) {
            try {
              const { message, subject, htmlLogo } =
                await generateEmailMessageToRecipient(ctx, "sent", doc, {
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
            } catch (e) {
              console.error("Error while sending the reminder for ", doc.id, e);
              captureException(e);
            }
          }
        }
      } catch (e) {
        console.error("Error while updating reminder for quote", doc.id, e);
        captureException(e);
      }
    }

    offset += limit;
  } while (docs.length === 100);
};

/**
 * This will set the initial first reminder date for all the invoices and quotes that are sent.
 */
export const setTriggerFirstReminderDate = () => {
  Framework.TriggersManager.registerTrigger<Invoices>(InvoicesDefinition, {
    name: "invoices-reminder-first",
    test: (_, next, prev) => {
      // When states changes to "sent"
      return (
        (next?.type === "quotes" || next?.type === "invoices") &&
        next?.state === "sent" &&
        prev?.state !== next?.state &&
        prev?.state !== "closed" &&
        prev?.state !== "completed"
      );
    },
    callback: async (ctx, doc) => {
      const db = await Framework.Db.getService();

      const next_reminder = new Date();
      next_reminder.setDate(
        next_reminder.getDate() + reminderDefaultDelayInDays
      );

      const client = await db.selectOne<Clients>(ctx, ClientsDefinition.name, {
        id: doc.client_id,
      });
      const timezone = client?.preferences?.timezone ?? "Europe/Paris";
      normalizeDate(next_reminder, timezone);

      await db.update<Invoices>(
        ctx,
        InvoicesDefinition.name,
        { id: doc.id },
        {
          next_reminder,
        }
      );
    },
  });
};
