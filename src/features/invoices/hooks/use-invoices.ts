import { RestOptions, useRest } from "@features/utils/rest/hooks/use-rest";
import { Invoices } from "../types/types";
import { useEffect } from "react";

export const useInvoices = (options?: RestOptions<Invoices>) => {
  const rest = useRest<Invoices>("invoices", options);

  useEffect(() => {
    rest.refresh();
  }, [JSON.stringify(options)]);

  return { invoices: rest.items, ...rest };
};

export const useInvoice = (id: string) => {
  const rest = useInvoices({ query: { id } });
  return {
    invoice: id ? (rest.invoices.data?.list || [])[0] : null,
    isPending: id ? rest.invoices.isPending : false,
    ...rest,
  };
};
