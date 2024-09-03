import { Button } from "@atoms/button/button";
import { Card } from "@atoms/card";
import { PageLoader } from "@atoms/page-loader";
import { useDocument } from "@features/documents/hooks";
import { Page } from "@views/client/_layout/page";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { twMerge } from "tailwind-merge";

export const DocumentPage = () => {
  const { document: documentID, client: clientID } = useParams();
  const { document, isLoadingDocument } = useDocument(documentID ?? "");

  const { t } = useTranslation();

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
        <div className="flex justify-center items-center h-full">
          <Card title="Signature du document">
            <div>Veuillez signez le document si-dessous :</div>
            <div className="flex mt-2">
              <Button>Signer</Button>
              <Button className="ml-2" theme="default">
                Voir
              </Button>
            </div>
          </Card>
        </div>
      </Page>
    </div>
  );
};
