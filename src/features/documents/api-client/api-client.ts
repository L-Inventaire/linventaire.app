import { fetchServer } from "@features/utils/fetch-server";
import { DocumentEntity } from "../types";

export class DocumentsApiClient {
  static getDocument = async (id: string): Promise<DocumentEntity> => {
    const response = await fetchServer(`/api/documents/v1/:${id}`, {
      method: "GET",
      body: JSON.stringify({}),
    });
    const data = await response.json();
    return data as DocumentEntity;
  };
}
