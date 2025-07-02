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
  const {
    signingSession,
    refetchSigningSession,
    signedDocument,
    refetchSignedDocument,
  } = useSigningSession(sessionID ?? "");
  const [isLoading, setIsLoading] = useState(false);

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

  // Add a useEffect to handle the document fetch when session is signed
  useEffect(() => {
    if (
      signingSession &&
      !isErrorResponse(signingSession) &&
      signingSession.state === "signed"
    ) {
      refetchSignedDocument();
    }
  }, [signingSession]);

  const invoiceData =
    signingSession && !isErrorResponse(signingSession)
      ? (signingSession.invoice_snapshot as unknown as Invoices)
      : null;

  const url = signedDocument
    ? window.URL.createObjectURL(
        new Blob([signedDocument ?? ""], { type: "application/pdf" })
      )
    : "";

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await refetchSignedDocument();
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
      documentUrl={url}
      showAlerts={false}
      actions={<ActionButtons isMobile={isMobile} />}
      imageWhenNoDocument={true}
    />
  );
};
