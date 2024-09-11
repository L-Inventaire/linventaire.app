import { Alert } from "@atoms/alert";
import { Button } from "@atoms/button/button";
import { Checkbox } from "@atoms/input/input-checkbox";
import { PageLoader } from "@atoms/page-loader";
import { Base, Section, Title } from "@atoms/text";
import { useSigningSession } from "@features/documents/hooks";
import { InvoicesApiClient } from "@features/invoices/api-client/invoices-api-client";
import { InvoiceLine, Invoices } from "@features/invoices/types/types";
import { getRoute, ROUTES } from "@features/routes";
import { isErrorResponse } from "@features/utils/rest/types/types";
import { Page } from "@views/client/_layout/page";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import styles from "./index.module.css";

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
  const { t } = useTranslation();

  const [options, setOptions] = useState<InvoiceLine[]>([]);

  useEffect(() => {
    viewSigningSession(sessionID ?? "");
  }, [signingSession]);

  const invoice =
    signingSession && !isErrorResponse(signingSession)
      ? (signingSession.invoice_snapshot as unknown as Invoices)
      : null;

  useEffect(() => {
    setOptions(
      invoice?.content
        ?.filter((line) => line.optional)
        .map((line) => ({ ...line })) ?? []
    );
  }, [invoice]);

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
              <Title>Document {invoice?.reference}</Title>
              <Section>
                Vous êtes authentifiés comme {signingSession.recipient}
              </Section>
            </div>

            <div className="w-full flex justify-center mb-6">
              {signingSession.state === "signed" && (
                <div className="flex flex-col justify-center items-center">
                  <Alert
                    title="Le document a déjà été signé"
                    theme="warning"
                    icon="CheckCircleIcon"
                  ></Alert>
                  <Button
                    className="mt-2"
                    onClick={() => {
                      navigate(
                        getRoute(ROUTES.SignedDocumentView, {
                          session: sessionID,
                        })
                      );
                    }}
                  >
                    Voir
                  </Button>
                </div>
              )}
              {signingSession.state === "sent" && (
                <div>
                  <Alert
                    title="Le document a déjà été envoyé"
                    theme="warning"
                    icon="CheckCircleIcon"
                  ></Alert>
                  <Button
                    className="mt-2"
                    onClick={() => {
                      window.open(signingSession.signing_url, "_blank");
                    }}
                  >
                    Voir
                  </Button>
                </div>
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
              ) &&
                invoice?.type !== "invoices" && (
                  <>
                    <Button
                      className="mr-2"
                      onClick={async () => {
                        const signedSession = await signSigningSession(
                          options ?? []
                        );
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
                    src={InvoicesApiClient.getPdfRoute(
                      {
                        client_id: invoice?.client_id ?? "",
                        id: invoice.id ?? "",
                      },
                      options
                    )}
                    title="Invoice PDF Preview"
                  ></iframe>
                )}
              </div>
            </div>

            {options.length > 0 && (
              <div>
                <Section>Options</Section>
                <div>
                  {options.map((option) => (
                    <div className="mb-2">
                      <Checkbox
                        disabled={
                          signingSession.state === "signed" ||
                          signingSession.state === "sent"
                        }
                        onChange={(value) => {
                          setOptions((options) =>
                            options.map((o) =>
                              o._id === option._id
                                ? { ...o, optional_checked: value }
                                : o
                            )
                          );
                        }}
                        label={option.name}
                        size={"md"}
                        value={option.optional_checked}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

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
