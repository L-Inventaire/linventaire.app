import Framework from "#src/platform/index";
import Invoices, {
  InvoicesDefinition,
} from "#src/services/modules/invoices/entities/invoices";
import { Context } from "#src/types";
import { getNextReviewDate } from "@shared/invoices";

/**
 * Give every active subscription (recurring quote) a default yearly "to review"
 * reminder, at the start of the last month of the recurrence, unless a reminder
 * has already been configured.
 */
export const setSubscriptionsReview = async (ctx: Context) => {
  const db = await Framework.Db.getService();
  let invoices: Invoices[] = [];
  let offset = 0;
  do {
    invoices = await db.select<Invoices>(
      ctx,
      InvoicesDefinition.name,
      { type: "quotes", state: "recurring" } as Partial<Invoices>,
      { offset, limit: 1000, index: "id" }
    );

    for (const entity of invoices) {
      // Don't override an already configured reminder
      if (entity.review?.reminders?.length) continue;

      const endReference = entity.subscription_ends_at
        ? new Date(entity.subscription_ends_at)
        : entity.subscription_started_at
        ? new Date(entity.subscription_started_at)
        : new Date();
      const review = {
        enabled: true,
        reminders: [
          { day: "first", month: String(endReference.getMonth() + 1) },
        ],
      };
      const next = getNextReviewDate(review, Date.now());

      await db.update<Invoices>(
        ctx,
        InvoicesDefinition.name,
        { id: entity.id, client_id: entity.client_id },
        { review, next_review_date: next ? new Date(next) : null },
        { triggers: false }
      );
    }

    console.log(
      "[migrations] Subscriptions review... offset=",
      offset,
      "length=",
      invoices.length
    );

    offset += invoices.length;
  } while (invoices.length > 0);

  console.log("[migrations] Set default yearly review date for subscriptions");
};
