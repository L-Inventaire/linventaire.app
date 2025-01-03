import { useClients } from "@features/clients/state/use-clients";
import { useContact } from "@features/contacts/hooks/use-contacts";
import { Invoices } from "@features/invoices/types/types";

export const useFormattedNumerotationByInvoice = (
  invoice: Invoices,
  countOverride?: number | undefined
) => {
  const clientUser = useClients();
  const client = clientUser?.client?.client;
  const { contact } = useContact(invoice.contact);

  const counter =
    contact?.overrides?.invoices_counters?.[invoice.type] ??
    client?.invoices_counters?.[invoice.type];

  const clientCounter = client?.invoices_counters?.[invoice.type];

  return getFormattedNumerotation(
    counter?.format ?? "INV-@YYYY-@CCCC",
    countOverride ?? clientCounter?.counter ?? 0,
    invoice.state === "draft",
    new Date(invoice.emit_date).getTime() || Date.now()
  );
};

export const getFormattedNumerotation = (
  format: string,
  counter: number,
  draft?: boolean,
  datets?: number
) => {
  if (format.indexOf("@C") === -1) {
    format = format + "-@C";
  }
  const date = new Date(datets || Date.now());

  let n = format.replace(/@YYYY/g, date.getFullYear().toString());
  n = n.replace(/@YY/g, date.getFullYear().toString().slice(-2));
  n = n.replace(/@MM/g, (date.getMonth() + 1).toString().padStart(2, "0"));
  n = n.replace(/@DD/g, date.getDate().toString().padStart(2, "0"));
  n = n.replace(/@CCCCCCCC/g, counter.toString().padStart(8, "0"));
  n = n.replace(/@CCCCCCC/g, counter.toString().padStart(7, "0"));
  n = n.replace(/@CCCCCC/g, counter.toString().padStart(6, "0"));
  n = n.replace(/@CCCCC/g, counter.toString().padStart(5, "0"));
  n = n.replace(/@CCCC/g, counter.toString().padStart(4, "0"));
  n = n.replace(/@CCC/g, counter.toString().padStart(3, "0"));
  n = n.replace(/@CC/g, counter.toString().padStart(2, "0"));
  n = n.replace(/@C/g, counter.toString());

  if (draft) n += "-DRAFT";

  return n;
};
