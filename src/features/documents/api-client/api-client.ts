import { fetchServer } from "@features/utils/fetch-server";
import { DocumentEntity } from "../types";

export class DocumentsApiClient {
  static getDocument = async (id: string): Promise<DocumentEntity> => {
    const response = await fetchServer("/api/documents/v1/" + id, {
      method: "GET",
    });

    const data = await response.json();
    return data as DocumentEntity;
  };

  static viewDocument = async (id: string, contactID: string) => {
    const response = await fetchServer("/api/documents/v1/" + id + "/view", {
      method: "POST",
      body: JSON.stringify({ contact_id: contactID }),
    });

    const data = await response.json();
    return data as DocumentEntity;
  };
}
