import { RestOptions, useRest } from "@features/utils/rest/hooks/use-rest";
import { Contacts } from "../types/types";
import { useEffect } from "react";

export const useContacts = (options?: RestOptions<Contacts>) => {
  const rest = useRest<Contacts>("contacts", options);

  useEffect(() => {
    rest.refresh();
  }, [JSON.stringify(options)]);

  return { contacts: rest.items, ...rest };
};

export const useContact = (id: string) => {
  const rest = useContacts({ id, limit: id ? 1 : 0 });
  return {
    contact: id ? (rest.contacts.data?.list || [])[0] : null,
    isPending: id ? rest.contacts.isPending : false,
    ...rest,
  };
};
