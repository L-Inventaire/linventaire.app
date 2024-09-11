import { Alert } from "@atoms/alert";
import { Button } from "@atoms/button/button";
import { PageLoader } from "@atoms/page-loader";
import { Base, Section, SectionSmall, Title } from "@atoms/text";
import { useSigningSession } from "@features/documents/hooks";
import { InvoicesApiClient } from "@features/invoices/api-client/invoices-api-client";
import { Invoices } from "@features/invoices/types/types";
import { isErrorResponse } from "@features/utils/rest/types/types";
import { Page } from "@views/client/_layout/page";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import styles from "./index.module.css";

export const SigningSessionPage = () => {
  const { session: sessionID } = useParams();
  const {
    signingSession,
    viewSigningSession,
    signSigningSession,
    cancelSigningSession,
    refetchSigningSession,
  } = useSigningSession(sessionID ?? "");
  const { t } = useTranslation();

  useEffect(() => {
    viewSigningSession(sessionID ?? "");
  }, [signingSession]);

  if (!signingSession)
    return (
      <div className="flex justify-center items-center h-full w-full dark:bg-wood-990 bg-white">
        <PageLoader />
      </div>
    );

  if (isErrorResponse(signingSession)) {
    return (
      <div
        className={twMerge(
          "sm:overflow-auto overflow-hidden relative flex w-full grow flex-row bg-slate-50 dark:bg-slate-950 h-screen intro-animated-root z-10"
        )}
      >
        <Page
          title={[
            {
              label: t("documents.index.title"),
            },
          ]}
        >
          <div className="w-full h-full flex flex-col items-center">
            <div className="w-3/4 bg-white flex flex-col justify-between items-center rounded-md p-6">
              <Base>An error occurred</Base>
            </div>
          </div>
        </Page>
      </div>
    );
  }

  const invoice = signingSession.invoice_snapshot as unknown as Invoices;

  return (
    <div
      className={twMerge(
        "sm:overflow-auto overflow-hidden relative flex w-full grow flex-row bg-slate-50 dark:bg-slate-950 h-screen intro-animated-root z-10"
      )}
    >
      <Page
        title={[
          {
            label: t("documents.index.title"),
          },
        ]}
      >
        <div className="w-full h-full flex flex-col items-center">
          <div className="w-3/4 bg-white flex flex-col justify-between items-center rounded-md p-6">
            <div className="flex flex-col justify-center items-center">
              <Title>Signature du document</Title>
              <Section>Veuillez signer le document</Section>
            </div>

            <div className="w-full flex justify-center mb-6">
              {signingSession.state === "signed" && (
                <Alert
                  title="Le document a déjà été signé"
                  theme="warning"
                  icon="CheckCircleIcon"
                ></Alert>
              )}
              {signingSession.state === "sent" && (
                <Alert
                  title="Le document a déjà été envoyé"
                  theme="warning"
                  icon="CheckCircleIcon"
                ></Alert>
              )}
              {signingSession.state === "cancelled" && (
                <Alert
                  title="Le document a été refusé"
                  theme="danger"
                  icon="CheckCircleIcon"
                ></Alert>
              )}
            </div>

            <div className="flex mb-4">
              {!["signed", "sent", "cancelled"].includes(
                signingSession.state
              ) && (
                <>
                  <Button
                    className="mr-2"
                    onClick={async () => {
                      const signedSession = await signSigningSession();
                      if (!signedSession.signing_url) {
                        toast.error(
                          "An error occurred while signing the document"
                        );
                        return;
                      }
                      window.open(signedSession.signing_url, "_blank");
                    }}
                  >
                    Signer
                  </Button>
                  <Button
                    theme="danger"
                    onClick={async () => {
                      await cancelSigningSession();
                      await refetchSigningSession();
                      toast.success("La signature a été refusée");
                    }}
                  >
                    Refuser
                  </Button>
                </>
              )}
            </div>

            <div className="w-full">
              <div className={styles.videoContainer}>
                {invoice && (
                  <iframe
                    src={InvoicesApiClient.getPdfRoute({
                      client_id: invoice?.client_id ?? "",
                      id: invoice.id ?? "",
                    })}
                    title="Invoice PDF Preview"
                  ></iframe>
                )}
              </div>
            </div>

            <div className="flex flex-col bg-white w-3/4 rounded-md p-3 mt-6">
              <Section>Historique</Section>
              {/* {(document?.events?.list ?? [])
                .filter((event) => !!event)
                .map((event) => (
                  <EventItem document={document} event={event} />
                ))} */}
            </div>
          </div>
        </div>
      </Page>
    </div>
  );
};
