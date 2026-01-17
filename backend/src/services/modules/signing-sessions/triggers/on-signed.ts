import platform from "#src/platform/index";
import Invoices, { InvoicesDefinition } from "../../invoices/entities/invoices";

export const onSigningSessionSigned = async (ctx, session) => {
  const db = await platform.Db.getService();
  const invoice = await db.selectOne<Invoices>(ctx, InvoicesDefinition.name, {
    id: session.invoice_id,
  });

  // If the invoice / quote has been closed / signed or paid, we don't need to update it
  if (!["sent"].includes(invoice.state)) return;

  await db.update<Invoices>(
    { ...ctx, client_id: invoice.client_id }, // This will ensure triggers runs
    InvoicesDefinition.name,
    { id: session.invoice_id },
    { ...invoice, state: "purchase_order" }
  );
};
