/**
 * Document Layout System
 *
 * This file contains shared components for displaying signing sessions and signed documents.
 * It provides a consistent layout across both use cases with:
 *
 * - Responsive design for both mobile and desktop views
 * - Shared PDF viewer component
 * - Unified header with TitleBar
 * - Options section for documents with optional items
 * - Action panels (sidebar on desktop, footer on mobile)
 * - Loading and error states handling
 *
 * The layout components handle most of the UI logic, while the parent components
 * (index.tsx and signed.tsx) only need to provide the document data and actions.
 */

import { Checkbox } from "@atoms/input/input-checkbox";
import { PageLoader } from "@atoms/page-loader";
import { Base, Section } from "@atoms/text";
import { SigningSession } from "@features/documents/types";
import { InvoiceLine, Invoices } from "@features/invoices/types/types";
import { isErrorResponse } from "@features/utils/rest/types/types";
import { AspectRatio } from "@radix-ui/themes";
import { Page } from "@views/client/_layout/page";
import React, { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";
import { TitleBar } from "./title-bar";
import { InternalSignatureForm } from "./internal-signature-form";

interface DocumentLayoutProps {
  signingSession: SigningSession | null;
  invoiceData: Invoices | null;
  isLoading: boolean;
  documentUrl: string;
  showAlerts?: boolean;
  options?: (InvoiceLine & { _index: number })[];
  onOptionChange?: (optionId: string, value: boolean) => void;
  actions: ReactNode;
  imageWhenNoDocument?: boolean;
  onSigned?: () => void;
}

// Error display when session has an error
export const DocumentError = () => {
  const { t } = useTranslation();

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
        <div className="w-full h-full flex flex-col items-center px-4 sm:px-0">
          <div className="w-full sm:w-3/4 bg-white flex flex-col justify-between items-center rounded-md p-4 sm:p-6">
            <Base>An error occurred</Base>
          </div>
        </div>
      </Page>
    </div>
  );
};

// Loading display
export const DocumentLoading = () => (
  <div className="flex justify-center items-center h-full w-full dark:bg-wood-990 bg-white">
    <PageLoader />
  </div>
);

// No document placeholder
export const NoDocumentPlaceholder = ({ isMobile = false }) => (
  <div
    className={`w-full h-full flex flex-col items-center justify-center ${
      isMobile ? "p-4" : "p-10"
    } bg-white`}
  >
    <div className={`${isMobile ? "w-full md:w-1/2 mb-4" : "w-80 mb-6"}`}>
      <AspectRatio ratio={1 / 1} className="flex justify-center">
        <img
          className="max-w-full h-auto"
          src="/medias/undraw_signing_document.svg"
          alt="Document signing illustration"
          loading="eager"
        />
      </AspectRatio>
    </div>
    <Section
      className={`m-0 font-normal text-center ${isMobile ? "text-sm" : ""}`}
    >
      Merci, la signature du document prendra quelque temps.
      <br /> Le document signé vous sera envoyé par email
    </Section>
  </div>
);

// Document options section
export const OptionsSection = ({
  options,
  onOptionChange,
  signingSession,
  compact = false,
}: {
  options: (InvoiceLine & { _index: number })[];
  onOptionChange: (optionId: string, value: boolean) => void;
  signingSession: SigningSession;
  compact?: boolean;
}) =>
  options.length > 0 && (
    <div className={compact ? "mb-2" : "mb-4"}>
      <Section className={compact ? "text-sm" : ""}>Options</Section>
      <div className="flex flex-wrap w-full mt-1 gap-2">
        {options.map((option) => (
          <div className="flex" key={option._id}>
            <Checkbox
              disabled={
                signingSession.state === "signed" ||
                signingSession.state === "sent"
              }
              onChange={(value) => onOptionChange(option._id || "", value)}
              label={option.name}
              size={compact ? "sm" : "md"}
              value={option.optional_checked}
            />
          </div>
        ))}
      </div>
    </div>
  );

// PDF Viewer component
export const DocumentViewer = ({
  url,
  title,
}: {
  url: string;
  title: string;
}) => {
  const [isLoading, setIsLoading] = React.useState(true);

  // Detect if we're on mobile (iOS/Android)
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Use Google Drive viewer for mobile to ensure full PDF display
  const viewerUrl = isMobile
    ? `https://drive.google.com/viewerng/viewer?embedded=true&url=${encodeURIComponent(
        url
      )}`
    : url;

  // Reset loading state when URL changes
  React.useEffect(() => {
    setIsLoading(true);
  }, [url]);

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <PageLoader />
        </div>
      )}
      <iframe
        className="absolute inset-0 w-full h-full border-0"
        src={viewerUrl}
        title={title}
        loading="eager"
        style={{ background: "white" }}
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
};

// Main document layout component
export const DocumentLayout = ({
  signingSession,
  invoiceData,
  isLoading,
  documentUrl,
  showAlerts = true,
  options = [],
  onOptionChange,
  actions,
  imageWhenNoDocument = false,
  onSigned,
}: DocumentLayoutProps) => {
  if (isLoading || !signingSession) {
    return <DocumentLoading />;
  }

  if (isErrorResponse(signingSession)) {
    return <DocumentError />;
  }

  // Check if internal signing mode
  const isInternalMode =
    signingSession.linventaire_signature &&
    signingSession.state !== "signed" &&
    signingSession.state !== "cancelled" &&
    signingSession.recipient_role === "signer";

  // Option change handler wrapper
  const handleOptionChange = (optionId: string, value: boolean) => {
    if (onOptionChange) {
      onOptionChange(optionId, value);
    }
  };

  const renderInfoSection = () => (
    <div className="mt-auto border-t border-gray-200 dark:border-gray-800 pt-4">
      <p className="text-xs text-gray-500 mb-2">Ce document a été envoyé à:</p>
      <p className="text-xs break-all">{signingSession.recipient_email}</p>
    </div>
  );

  return (
    <div className="flex flex-col h-dvh w-full overflow-hidden bg-white">
      {/* Mobile View */}
      <div className="md:hidden flex flex-col h-dvh">
        {/* Header for mobile - more compact */}
        <div className="bg-white px-2 py-1 shadow-sm z-10">
          <TitleBar
            signingSession={signingSession}
            invoice={invoiceData}
            alerts={showAlerts}
            className="mb-0"
            compact={true}
          />

          {/* Options section for mobile - only if not internal mode */}
          {!isInternalMode && options.length > 0 && (
            <div className="px-1 mt-1">
              <OptionsSection
                options={options}
                onOptionChange={handleOptionChange}
                signingSession={signingSession}
                compact={true}
              />
            </div>
          )}
        </div>

        {/* PDF Content or Internal Form on mobile */}
        {isInternalMode ? (
          <div className="flex-grow flex flex-col overflow-hidden">
            {/* Document preview - 40% height */}
            <div className="grow relative border-b border-gray-200">
              {documentUrl ? (
                <DocumentViewer
                  url={documentUrl}
                  title={`${
                    invoiceData?.type === "invoices" ? "Facture" : "Devis"
                  } ${invoiceData?.reference}`}
                />
              ) : (
                <NoDocumentPlaceholder isMobile={true} />
              )}
            </div>
            {/* Signature form - 60% height, scrollable */}
            <div className="h-max max-h-[90%] shrink-0 overflow-y-auto bg-white">
              <InternalSignatureForm
                signingSession={signingSession}
                options={options}
                onOptionChange={handleOptionChange}
                onSigned={onSigned || (() => {})}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="flex-grow relative overflow-hidden">
              {documentUrl ? (
                <DocumentViewer
                  url={documentUrl}
                  title={`${
                    invoiceData?.type === "invoices" ? "Facture" : "Devis"
                  } ${invoiceData?.reference}`}
                />
              ) : (
                imageWhenNoDocument && <NoDocumentPlaceholder isMobile={true} />
              )}
            </div>

            {/* Footer with actions for mobile - only if not internal mode */}
            <div className="bg-gray-100 dark:bg-gray-900 p-3 shadow-inner flex justify-center">
              <div className="w-full px-2">{actions}</div>
            </div>
          </>
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden md:flex w-full h-full">
        <div className="flex flex-col w-full h-screen">
          {/* Thin header bar for desktop */}
          <div className="bg-white px-4 py-1 shadow-sm z-10 flex items-center justify-end">
            <TitleBar
              signingSession={signingSession}
              invoice={invoiceData}
              alerts={showAlerts}
              className="mb-0 max-w-screen-2xl mx-auto"
              compact={true}
            />
          </div>

          {/* Main document area */}
          <div className="flex flex-1 overflow-hidden">
            {/* Document container */}
            <div className="flex-grow relative">
              {documentUrl ? (
                <DocumentViewer
                  url={documentUrl}
                  title={`${
                    invoiceData?.type === "invoices" ? "Facture" : "Devis"
                  } ${invoiceData?.reference}`}
                />
              ) : (
                imageWhenNoDocument && <NoDocumentPlaceholder />
              )}
            </div>

            {/* Small action sidebar */}
            {signingSession.state !== "signed" && (
              <div className="w-72 h-full border-l border-gray-200 dark:border-gray-800 bg-white flex flex-col">
                {isInternalMode ? (
                  <InternalSignatureForm
                    signingSession={signingSession}
                    options={options}
                    onOptionChange={handleOptionChange}
                    onSigned={onSigned || (() => {})}
                  />
                ) : (
                  <div className="p-4 flex flex-col h-full">
                    <h3 className="font-medium text-sm mb-4">Actions</h3>
                    {actions}

                    {options.length > 0 && (
                      <div className="mt-6 border-t border-gray-200 dark:border-gray-800 pt-4">
                        <h4 className="font-medium text-sm mb-2">Options</h4>
                        <div className="flex flex-col gap-2">
                          {options.map((option) => (
                            <Checkbox
                              key={option._id}
                              disabled={
                                signingSession.state === "signed" ||
                                signingSession.state === "sent"
                              }
                              onChange={(value) =>
                                handleOptionChange(option._id || "", value)
                              }
                              label={option.name}
                              size="sm"
                              value={option.optional_checked}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {renderInfoSection()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
