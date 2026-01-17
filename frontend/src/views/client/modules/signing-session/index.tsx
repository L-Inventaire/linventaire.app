import { Button } from "@atoms/button/button";
import { Input } from "@atoms/input/input-text";
import { useSigningSession } from "@features/documents/hooks";
import { InvoicesApiClient } from "@features/invoices/api-client/invoices-api-client";
import { InvoiceLine, Invoices } from "@features/invoices/types/types";
import { getRoute, ROUTES } from "@features/routes";
import { isErrorResponse } from "@features/utils/rest/types/types";
import { CheckIcon, XCircleIcon } from "@heroicons/react/16/solid";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { DocumentLayout } from "./components/document-layout";
import { useMobile } from "./hooks/use-mobile";
import Env from "@/config/environment";

export const SigningSessionPage = () => {
  const navigate = useNavigate();

  const { session: sessionID } = useParams();
  const {
    signingSession,
    viewSigningSession,
    signSigningSession,
    cancelSigningSession,
    refetchSigningSession,
  } = useSigningSession(sessionID ?? "");
  const { t: _t } = useTranslation(); // Unused but keeping for future localization

  const [options, setOptions] = useState<(InvoiceLine & { _index: number })[]>(
    []
  );
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    viewSigningSession(sessionID ?? "");
  }, [sessionID]);

  const invoiceSnapshot =
    signingSession && !isErrorResponse(signingSession)
      ? (signingSession.invoice_snapshot as unknown as Invoices)
      : null;

  useEffect(() => {
    setOptions(
      invoiceSnapshot?.content
        ?.map((line, i) => ({ ...line, _index: i }))
        ?.filter((line) => line.optional)
        .map((line) => ({ ...line })) ?? []
    );
  }, [invoiceSnapshot]);

  // Handler to prevent multiple clicks
  const handleSignDocument = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const signedSession = await signSigningSession(options ?? []);
      if (!signedSession.signing_url) {
        toast.error("An error occurred while signing the document");
        return;
      }
      window.location.href = signedSession.signing_url;
    } catch (error) {
      toast.error("An error occurred while processing your request");
      console.error("Signing error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for document opening
  const openSigningUrl = () => {
    if (signingSession?.signing_url) {
      window.location.href = signingSession.signing_url;
    }
  };

  // URL for the PDF document
  const pdfUrl = invoiceSnapshot
    ? InvoicesApiClient.getPdfRoute(
        {
          client_id: invoiceSnapshot?.client_id ?? "",
          id: invoiceSnapshot.id ?? "",
        },
        { checked: options }
      )
    : "";

  // Use signed document URL if state is signed, otherwise use the original PDF
  // Add timestamp to force iframe reload after signing
  const documentUrl =
    signingSession?.state === "signed" && sessionID
      ? `${Env.server.replace(
          /\/$/,
          ""
        )}/api/signing-sessions/v1/${sessionID}/download?t=${
          signingSession.state
        }`
      : pdfUrl;

  // Handle option change
  const handleOptionChange = (optionId: string, value: boolean) => {
    setOptions((options) =>
      options.map((o) =>
        o._id === optionId ? { ...o, optional_checked: value } : o
      )
    );
  };

  // Action buttons component
  const ActionButtons = ({ isMobile = false }) => {
    const buttonClasses = isMobile ? "w-full" : "";

    return (
      <div className={`flex ${isMobile ? "flex-col" : "flex-col"} gap-2`}>
        {signingSession?.state === "signed" && false && (
          <Button
            className={buttonClasses}
            onClick={() => {
              navigate(
                getRoute(ROUTES.SignedDocumentView, {
                  session: sessionID,
                })
              );
            }}
          >
            Voir le document signé
          </Button>
        )}

        {signingSession?.state === "sent" && (
          <Button className={buttonClasses} onClick={openSigningUrl}>
            Signer le document
          </Button>
        )}

        {invoiceSnapshot?.type === "quotes" &&
          invoiceSnapshot?.state === "sent" &&
          signingSession?.state !== "cancelled" &&
          signingSession?.state !== "signed" &&
          signingSession?.recipient_role === "signer" &&
          !signingSession?.expired &&
          invoiceSnapshot.is_deleted === false && (
            <>
              <Button
                className={buttonClasses}
                onClick={handleSignDocument}
                disabled={isLoading}
              >
                {isLoading ? "Chargement..." : "Accepter et signer"}
              </Button>

              {!cancelling && (
                <Button
                  theme="danger"
                  className={buttonClasses}
                  onClick={() => setCancelling(true)}
                >
                  Refuser
                </Button>
              )}

              {cancelling && (
                <div
                  className={`flex ${
                    isMobile ? "flex-col" : "flex-col"
                  } w-full items-center gap-2`}
                >
                  <Button
                    theme="default"
                    className={`${buttonClasses}`}
                    onClick={() => setCancelling(false)}
                    icon={(p) => <XCircleIcon {...p} />}
                  >
                    Annuler
                  </Button>
                  <Input
                    className={`${isMobile ? "w-full" : "w-full"}`}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Raison du refus"
                  />
                  <Button
                    theme="danger"
                    className={buttonClasses}
                    onClick={async () => {
                      try {
                        setIsLoading(true);
                        await cancelSigningSession(cancelReason);
                        await refetchSigningSession();
                        toast.success("La signature a été refusée avec succès");
                      } catch (error) {
                        toast.error("Une erreur est survenue");
                        console.error("Cancel error:", error);
                      } finally {
                        setIsLoading(false);
                        setCancelling(false);
                      }
                    }}
                    disabled={isLoading}
                    icon={(p) => <CheckIcon {...p} />}
                  >
                    Confirmer le refus
                  </Button>
                </div>
              )}
            </>
          )}
      </div>
    );
  };

  const isMobile = useMobile();

  // Handle internal signing completion
  const handleInternalSigned = async () => {
    await refetchSigningSession();
  };

  return (
    <DocumentLayout
      signingSession={
        signingSession && !isErrorResponse(signingSession)
          ? signingSession
          : null
      }
      invoiceData={invoiceSnapshot}
      isLoading={isLoading || !signingSession}
      documentUrl={documentUrl}
      showAlerts={true}
      options={options}
      onOptionChange={handleOptionChange}
      actions={<ActionButtons isMobile={isMobile} />}
      onSigned={handleInternalSigned}
    />
  );
};
