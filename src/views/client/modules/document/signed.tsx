import { Button } from "@atoms/button/button";
import { PageLoader } from "@atoms/page-loader";
import { Base, Section, Title } from "@atoms/text";
import { SigningSessionsApiClient } from "@features/documents/api-client/api-client";
import { useSigningSession } from "@features/documents/hooks";
import { isErrorResponse } from "@features/utils/rest/types/types";
import { Page } from "@views/client/_layout/page";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import styles from "./index.module.css";

export const SignedSessionPage = () => {
  const { session: sessionID } = useParams();
  const {
    signingSession,
    refetchSigningSession,
    signedDocument,
    refetchSignedDocument,
  } = useSigningSession(sessionID ?? "");
  const { t } = useTranslation();

  useEffect(() => {
    async function action() {
      await SigningSessionsApiClient.confirmSignSigningSession(sessionID ?? "");
      await refetchSigningSession();
    }

    action();
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

  const url = signedDocument
    ? window.URL.createObjectURL(
        new Blob([signedDocument ?? ""], { type: "application/pdf" })
      )
    : "";

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
            <div className="flex flex-col justify-center items-center mb-6">
              <Title>Document signé</Title>
              <Section>
                Veuillez retrouver ci-dessous le document duement signé
              </Section>
            </div>

            <div className="w-full">
              {url && (
                <div className={styles.videoContainer}>
                  <iframe src={url} title="Invoice PDF Preview" />
                </div>
              )}
              {!signedDocument && (
                <>
                  <Base>Le document est en cours de signature.</Base>
                  <Button onClick={() => refetchSignedDocument()}>
                    Raffraichir
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Page>
    </div>
  );
};
