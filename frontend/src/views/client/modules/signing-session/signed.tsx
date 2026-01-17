import { Button } from "@atoms/button/button";
import { SigningSessionsApiClient } from "@features/documents/api-client/api-client";
import { useSigningSession } from "@features/documents/hooks";
import { Invoices } from "@features/invoices/types/types";
import { isErrorResponse } from "@features/utils/rest/types/types";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DocumentLayout } from "./components/document-layout";
import { useMobile } from "./hooks/use-mobile";

export const SignedSessionPage = () => {
  const { session: sessionID } = useParams();
  const { signingSession, refetchSigningSession } = useSigningSession(
    sessionID ?? ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTimestamp, setRefreshTimestamp] = useState(Date.now());

  useEffect(() => {
    async function action() {
      if (!sessionID) return;
      try {
        setIsLoading(true);
        await SigningSessionsApiClient.confirmSignSigningSession(sessionID);
        await refetchSigningSession();
      } catch (error) {
        console.error("Error confirming signing session:", error);
      } finally {
        setIsLoading(false);
      }
    }

    action();
  }, [sessionID]);

  const invoiceData =
    signingSession && !isErrorResponse(signingSession)
      ? (signingSession.invoice_snapshot as unknown as Invoices)
      : null;

  // Use direct API URL with timestamp to force refresh
  const documentUrl =
    signingSession?.state === "signed" && sessionID
      ? `/api/signing-sessions/v1/${sessionID}/download?t=${refreshTimestamp}`
      : "";

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      setRefreshTimestamp(Date.now());
      await refetchSigningSession();
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh button component
  const ActionButtons = ({ isMobile = false }) => {
    const buttonClasses = isMobile ? "w-full" : "";

    return (
      <Button
        onClick={handleRefresh}
        disabled={isLoading}
        className={buttonClasses}
      >
        {isLoading
          ? "Chargement..."
          : isMobile
          ? "Rafraîchir le document"
          : "Rafraîchir"}
      </Button>
    );
  };

  const isMobile = useMobile();

  return (
    <DocumentLayout
      signingSession={
        signingSession && !isErrorResponse(signingSession)
          ? signingSession
          : null
      }
      invoiceData={invoiceData}
      isLoading={isLoading && !signingSession}
      documentUrl={documentUrl}
      showAlerts={false}
      actions={<ActionButtons isMobile={isMobile} />}
      imageWhenNoDocument={true}
    />
  );
};
