import { PageLoader } from "@atoms/page-loader";
import { useDocument } from "@features/documents/hooks";
import { Page } from "@views/client/_layout/page";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

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
    <Page
      title={[
        {
          label: t("documents.index.title"),
        },
      ]}
    >
      <div>TEST</div>
    </Page>
  );
};
