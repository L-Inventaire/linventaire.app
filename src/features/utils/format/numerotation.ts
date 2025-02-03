import { useClients } from "@features/clients/state/use-clients";
import { Clients } from "@features/clients/types/clients";
import { Invoices } from "@features/invoices/types/types";
import _ from "lodash";

export const getOptimalCounterFormat = (
  invoicesCounters: Clients["invoices_counters"],
  type: keyof Clients["invoices_counters"][0],
  date?: Date | string | number
) => {
  return (
    _.get(invoicesCounters, [
      new Date(date || Date.now()).getFullYear().toString(),
      type,
    ]) ||
    _.get(invoicesCounters, [
      new Date(Date.now()).getFullYear().toString(),
      type,
    ])
  );
};

// Caution: A similar function is also present in the backend, if you change it here, change it there too
export const useFormattedNumerotationByInvoice = () => {
  const clientUser = useClients();
  const client = clientUser?.client?.client;

  return (invoice: Invoices) => {
    const type: keyof Clients["invoices_counters"][0] =
      invoice?.state === "draft" &&
      (invoice?.type === "invoices" || invoice?.type === "credit_notes")
        ? "drafts"
        : invoice?.type;
    const year = new Date(invoice.emit_date || Date.now())
      .getFullYear()
      .toString();
    const clientCounter = client?.invoices_counters?.[year]?.[type];
    return getFormattedNumerotation(
      clientCounter?.format ?? "INV-@YYYY-@CCCC",
      clientCounter?.counter ?? 0,
      new Date(invoice.emit_date).getTime() || Date.now()
    );
  };
};

// Caution: a similar function is also present in the backend, if you change it here, change it there too
export const getFormattedNumerotation = (
  format: string,
  counter: number,
  datets?: number
) => {
  if (format.indexOf("@C") === -1) {
    format = format ? format + "-@C" : "@C";
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

  return n;
};
