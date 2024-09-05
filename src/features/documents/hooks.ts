import { useQuery } from "@tanstack/react-query";
import { DocumentsApiClient } from "./api-client/api-client";

export const useDocument = (id: string) => {
  const { data: document, isLoading: isLoadingDocument } = useQuery({
    queryKey: ["document", id],
    queryFn: () => DocumentsApiClient.getDocument(id),
  });

  const viewDocument = (contactID: string) => {
    DocumentsApiClient.viewDocument(id, contactID);
  };

  const signDocument = (contactID: string) => {
    DocumentsApiClient.signDocument(id, contactID);
  };

  return { document, isLoadingDocument, viewDocument, signDocument };
};
