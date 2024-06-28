import { useCurrentClient } from "@features/clients/state/use-clients";
import { registerCtrlKRestEntity } from "@features/ctrlk";
import { ROUTES } from "@features/routes";
import { InvoicesDetailsPage } from "@views/client/modules/invoices/components/invoices-details";
import { Invoices } from "./types/types";

export const useInvoiceDefaultModel: () => Partial<Invoices> = () => {
  const { client } = useCurrentClient();

  return {
    type: "quotes",
    state: "draft",
    language: client!.preferences?.language || "fr",
    currency: client!.preferences?.currency || "EUR",
    format: client!.invoices,
    payment_information: client!.payment,
  };
};

registerCtrlKRestEntity<Invoices>(
  "invoices",
  (props) => <InvoicesDetailsPage readonly={false} id={props.id} />,
  (invoice) => <>{invoice.reference}</>,
  useInvoiceDefaultModel,
  ROUTES.StockView
);
