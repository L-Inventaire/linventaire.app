import { RestOptions, useRest } from "@features/utils/rest/hooks/use-rest";
import { Contacts } from "../types/types";
import { useEffect, useState } from "react";
import { ContactsApiClient } from "../api-client/contacts-api-client";
import { useClients } from "@features/clients/state/use-clients";

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

const getContactsRecurrent = async (
  clientID?: string,
  contactID?: string,
  layers?: number
) => {
  if (!contactID || !layers || !clientID) {
    return [];
  }

  if (layers === 0) {
    return [];
  }

  const root = await ContactsApiClient.get(clientID, contactID);

  let relations: Contacts[] = [];
  for (const parent of root?.parents || []) {
    const parents = await getContactsRecurrent(clientID, parent, layers - 1);
    relations = [...relations, ...parents];
  }

  return [root, ...relations];
};

export const useContactsRecursively = (contactID?: string, layers?: number) => {
  const { client: clientUser } = useClients();
  const client = clientUser!.client!;

  const [contacts, setContacts] = useState<Contacts[]>([]);
  useEffect(() => {
    async function exec() {
      const result = await getContactsRecurrent(
        client.id,
        contactID,
        layers ?? 0
      );
      setContacts(result);
    }
    exec();
  }, [contactID, layers]);

  return contacts;
};
