import { RestOptions, useRest } from "@features/utils/rest/hooks/use-rest";
import { Contacts } from "../types/types";

export const useContacts = (options?: RestOptions<Contacts>) => {
  const rest = useRest<Contacts>("contacts", options);
  return { contacts: rest.items, ...rest };
};

export const useContact = (id: string) => {
  const rest = useContacts({ query: { id } });
  return {
    contact: (rest.contacts.data || [])[0],
    isPending: rest.contacts.isPending,
    ...rest,
  };
};
