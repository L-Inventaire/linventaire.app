import { useQuery } from "@tanstack/react-query";
import { SigningSessionsApiClient } from "./api-client/api-client";

export const useSigningSession = (id: string) => {
  const { data: signingSession, isLoading: isLoadingDocument } = useQuery({
    queryKey: ["signing-session", id],
    queryFn: () => SigningSessionsApiClient.getSigningSession(id),
  });

  const viewSigningSession = (contactID: string) => {
    SigningSessionsApiClient.viewSigningSessio(id, contactID);
  };

  const signSigningSession = () => {
    return SigningSessionsApiClient.signSigningSession(id);
  };

  return {
    signingSession,
    isLoadingDocument,
    viewSigningSession,
    signSigningSession,
  };
};
