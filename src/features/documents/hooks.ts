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

  const {
    data: signedDocument,
    isLoading: isLoadingSignedDocument,
    refetch: refetchSignedDocument,
  } = useQuery({
    queryKey: ["signing-session", id, "document"],
    queryFn: async () =>
      await SigningSessionsApiClient.downloadSignedDocument(id),
    enabled:
      signingSession &&
      !isErrorResponse(signingSession) &&
      signingSession.state === "signed",
    retry: (failureCount) => {
      if (failureCount > 30) {
        return false;
      }

      return (
        (signingSession &&
          !isErrorResponse(signingSession) &&
          signingSession.state === "signed") ??
        false
      );
    },
    // retry: 50,
    retryDelay: 3000,
    retryOnMount: true,
  });

  const viewSigningSession = async (contactID: string) => {
    await SigningSessionsApiClient.viewSigningSessio(id, contactID);
  };

  const signSigningSession = (options?: InvoiceLine[]) => {
    return SigningSessionsApiClient.signSigningSession(id, options);
  };

  const cancelSigningSession = () => {
    return SigningSessionsApiClient.cancelSigningSession(id);
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
    signedDocument,
    isLoadingSignedDocument,
    refetchSignedDocument,
    cancelSigningSession,
  };
};
