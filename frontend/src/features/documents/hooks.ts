import { useQuery } from "@tanstack/react-query";
import { SigningSessionsApiClient } from "./api-client/api-client";
import { isErrorResponse } from "@features/utils/rest/types/types";
import { InvoiceLine } from "@features/invoices/types/types";

export const useSigningSession = (id: string) => {
  const {
    data: signingSession,
    isLoading: isLoadingDocument,
    refetch: refetchSigningSession,
  } = useQuery({
    queryKey: ["signing-session", id],
    queryFn: () => SigningSessionsApiClient.getSigningSession(id),
  });

  const viewSigningSession = async (contactID: string) => {
    await SigningSessionsApiClient.viewSigningSessio(id, contactID);
  };

  const signSigningSession = (options?: InvoiceLine[]) => {
    return SigningSessionsApiClient.signSigningSession(id, options);
  };

  const cancelSigningSession = (cancelReason?: string) => {
    return SigningSessionsApiClient.cancelSigningSession(
      id,
      cancelReason ?? ""
    );
  };

  const downloadSignedDocument = async () => {
    return await SigningSessionsApiClient.downloadSignedDocument(id);
  };

  return {
    signingSession,
    refetchSigningSession,
    isLoadingDocument,
    viewSigningSession,
    signSigningSession,
    downloadSignedDocument,
    cancelSigningSession,
  };
};
