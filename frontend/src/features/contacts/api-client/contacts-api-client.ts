import { fetchServer } from "@features/utils/fetch-server";
import { Contacts } from "../types/types";

export class ContactsApiClient {
  static get = async (clientID: string, contactID: string) => {
    const response = await fetchServer(
      `/api/rest/v1/${clientID}/contacts/${contactID}`
    );
    const data = await response.json();
    return data as Contacts;
  };

  static getSireneData = async (
    clientId: string,
    siret: string
  ): Promise<
    Partial<{
      siret: string;
      address: {
        address_line_1: string;
        address_line_2: string;
        city: string;
        region: string;
        country: string;
        zip: string;
      };
      name: string;
    }>
  > => {
    if (siret.length < 14) return {};
    return await (
      await fetchServer(
        `/api/contacts/v1/clients/${clientId}/sirene/` +
          siret
            .toLocaleUpperCase()
            .replace(/[^A-Z0-9]/gm, "")
            .slice(0, 14)
      )
    ).json();
  };
}
