import Framework from "#src/platform/index";
import Invoices, {
  InvoicesDefinition,
} from "#src/services/modules/invoices/entities/invoices";
import { recomputeCompletionStatus } from "#src/services/modules/invoices/triggers/on-complete";
import { Context } from "#src/types";

export const recomputeAllCompletionStatus = async (ctx: Context) => {
  const db = await Framework.Db.getService();
  // For all invoices
  const invoices = await db.select<Invoices>(ctx, InvoicesDefinition.name, {});
  for (const invoice of invoices) {
    // Mark them as not deleted
    await recomputeCompletionStatus(ctx, invoice.client_id, invoice.id);
  }
};
