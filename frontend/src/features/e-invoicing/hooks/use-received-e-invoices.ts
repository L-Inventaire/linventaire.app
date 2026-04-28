import { RestOptions, useRest } from "@features/utils/rest/hooks/use-rest";
import { useEffect } from "react";
import { ReceivedEInvoices } from "../types/types";

export const useReceivedEInvoices = (
  options?: RestOptions<ReceivedEInvoices>,
) => {
  const rest = useRest<ReceivedEInvoices>("received_e_invoices", options ?? {});

  useEffect(() => {
    rest.refresh();
  }, [JSON.stringify(options)]);

  return { receivedEInvoices: rest.items, ...rest };
};

export const useReceivedEInvoice = (id: string) => {
  const rest = useReceivedEInvoices({ id });
  return {
    receivedEInvoice: id ? (rest.receivedEInvoices.data?.list || [])[0] : null,
    ...rest,
  };
};
