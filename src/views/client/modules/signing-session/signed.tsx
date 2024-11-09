import { Button } from "@atoms/button/button";
import { PageLoader } from "@atoms/page-loader";
import { Base, Section } from "@atoms/text";
import { SigningSessionsApiClient } from "@features/documents/api-client/api-client";
import { useSigningSession } from "@features/documents/hooks";
import { Invoices } from "@features/invoices/types/types";
import { isErrorResponse } from "@features/utils/rest/types/types";
import { AspectRatio } from "@radix-ui/themes";
import { Page } from "@views/client/_layout/page";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import { TitleBar } from "./components/title-bar";

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
        "sm:overflow-auto overflow-hidden relative flex w-full bg-white grow flex-row bg-slate-50 dark:bg-slate-950 h-screen intro-animated-root z-10"
      )}
    >
      <Page
        title={[
          {
            label: t("documents.index.title"),
          },
        ]}
      >
        <div className="w-full h-full flex flex-col items-center justify-center grow">
          <div className="max-w-2xl w-full h-full flex flex-col items-center rounded-md grow">
            <div className="w-full">
              <TitleBar
                className={"mb-8"}
                signingSession={signingSession}
                invoice={signingSession.invoice_snapshot as unknown as Invoices}
                alerts={false}
              />
            </div>

            {url && (
              <iframe
                className="w-full grow"
                src={url}
                title="Invoice PDF Preview"
              />
            )}
            {/* {isLoadingSignedDocument && (
              <Card className="w-full h-full">
                <Loader />
              </Card>
            )} */}
            {!signedDocument && (
              <div className="flex flex-col w-full h-2/3 p-10 justify-center items-center bg-white rounded-lg">
                <div className="w-full md:w-1/2 mb-6">
                  <AspectRatio ratio={1 / 1} className="flex justify-center">
                    <img
                      className="Image"
                      src="/medias/undraw_signing_document.svg"
                      alt="Landscape photograph by Tobias Tullius"
                    />
                  </AspectRatio>
                </div>
                <div className="flex flex-col items-center justify-center mb-6">
                  <Section className="m-0 mr-2 font-normal text-center">
                    Merci, la signature du document prendra quelque temps.
                    <br /> Le document signé vous sera envoyé par email
                  </Section>

                  <div className="flex mt-4 justify-center items-center">
                    <Button
                      onClick={async () => {
                        await refetchSignedDocument();
                      }}
                    >
                      Rafraîchir
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Page>
    </div>
  );
};
