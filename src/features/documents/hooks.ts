import { useQuery } from "@tanstack/react-query";
import { DocumentsApiClient } from "./api-client/api-client";

export const useDocument = (id: string) => {
  const { data: document, isLoading: isLoadingDocument } = useQuery({
    queryKey: ["document", id],
    queryFn: () => DocumentsApiClient.getDocument(id),
  });

  console.log("document", document, isLoadingDocument);

  return { document, isLoadingDocument };
};
