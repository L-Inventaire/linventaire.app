import { Button } from "@atoms/button/button";
import { PageLoader } from "@atoms/page-loader";
import { Section, Title } from "@atoms/text";
import { useDocument } from "@features/documents/hooks";
import { Page } from "@views/client/_layout/page";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import { EventItem } from "./components/event-item";
import { useEffect } from "react";

export const DocumentPage = () => {
  const { document: documentID, contact: contactID } = useParams();
  const { document, viewDocument } = useDocument(documentID ?? "");

  console.log("contactID", contactID, "documentID", documentID);
  console.log("document", document);

  const { t } = useTranslation();

  useEffect(() => {
    viewDocument(contactID ?? "");
  }, [document]);

  if (!document)
    return (
      <div className="flex justify-center items-center h-full w-full dark:bg-wood-990 bg-white">
        <PageLoader />
      </div>
    );

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
        <div className="w-full h-full flex flex-col justify-center items-center">
          <div className="w-3/4 h-3/4 bg-white flex flex-col justify-between items-center rounded-md p-6">
            <div className="flex flex-col justify-center items-center">
              <Title>Signature du document</Title>
              <Section>Veuillez signez le document</Section>
            </div>

            <div>
              <Section>Document.pdf</Section>
              <div className="flex mt-2">
                <Button className="mr-2">Signer</Button>
                <Button>Veto</Button>
              </div>
            </div>

            <div className="flex flex-col bg-white w-3/4 rounded-md p-3">
              <Section>Historique</Section>
              {(document?.events?.list ?? [])
                .filter((event) => !!event)
                .map((event) => (
                  <EventItem document={document} event={event} />
                ))}
            </div>
          </div>
        </div>
      </Page>
    </div>
  );
};
