import { Clients, Invoices, Payment } from "@features/clients/types/clients";
import { Contacts } from "@features/contacts/types/types";

export type InvoiceDefaultFormatType = {
  invoices: Invoices;
  payment: Payment;
};

export const getDefaultConfig = (
  client?: Clients,
  contact?: Contacts,
  default_?: "client" | "contact"
): InvoiceDefaultFormatType | null => {
  if (!client) return null;

  const defaultFormat = {
    invoices:
      contact?.overrides?.invoices && default_ === "contact"
        ? contact.overrides.invoices
        : client.invoices,
    payment: contact?.overrides?.payment
      ? contact?.overrides?.payment
      : client.payment,
  };

  return {
    invoices: defaultFormat.invoices,
    payment: defaultFormat.payment,
  };
};
