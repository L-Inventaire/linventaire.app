import { Alert } from "@atoms/alert";
import { Info, Section, Title } from "@atoms/text";
import { SigningSession } from "@features/documents/types";
import { Invoices } from "@features/invoices/types/types";
import _ from "lodash";
import { twMerge } from "tailwind-merge";

export type TitleBarProps = {
  signingSession: SigningSession;
  invoice: Invoices | null;
  alerts: boolean;
  compact?: boolean;
} & React.ComponentProps<"div">;

export const TitleBar = ({
  signingSession,
  invoice,
  alerts,
  compact = false,
  ...props
}: TitleBarProps) => {
  return (
    <div
      className={twMerge(
        "w-full flex flex-col md:flex-row gap-2 md:gap-4 items-center",
        compact ? "mt-0 py-1" : "mt-6",
        props.className
      )}
      {..._.omit(props, "className")}
    >
      <div
        className={`${compact ? "w-auto" : "w-full"} h-full flex items-center`}
      >
        <div className="flex items-center">
          <img
            className={`${compact ? "h-5" : "h-6"} w-auto dark:hidden`}
            src="/medias/logo.png"
            alt="L'inventaire"
          />
          <img
            className={`mx-auto ${
              compact ? "h-5" : "h-6"
            } w-auto hidden dark:block`}
            src="/medias/logo.svg"
            alt="L'inventaire"
          />
          {!compact && (
            <Section className="m-0 ml-2 font-normal">L'inventaire</Section>
          )}
        </div>
        {!compact && (
          <Info className="text-xs ml-2 break-all">
            {signingSession.state === "signed" && "Signé par:"}{" "}
            {signingSession.recipient_email}
          </Info>
        )}
      </div>

      <div
        className={`flex flex-col ${
          compact ? "flex-1 mx-2" : "w-full"
        } items-center`}
      >
        <Title
          className={`text-center ${
            compact ? "text-sm" : "text-base sm:text-lg md:text-xl"
          }`}
        >
          {invoice?.type === "invoices" ? "Facture" : "Devis"}{" "}
          {invoice?.reference}
        </Title>
      </div>

      <div className={compact ? "flex-shrink-0" : "w-full"}>
        {signingSession.expired && signingSession.state !== "cancelled" && (
          <Alert
            title="Document expiré"
            theme="warning"
            icon="CheckCircleIcon"
            className={`p-0 ${compact ? "text-xs" : "text-sm md:-mt-2"}`}
          ></Alert>
        )}
        {signingSession.state === "signed" && alerts && (
          <Alert
            title="Le document a déjà été signé"
            theme="warning"
            icon="CheckCircleIcon"
            className={`p-0 ${compact ? "text-xs" : "text-sm md:-mt-2"}`}
          ></Alert>
        )}
        {signingSession.state === "sent" && alerts && (
          <Alert
            title="La session de signature a été démarrée"
            theme="warning"
            icon="CheckCircleIcon"
            className={`p-0 ${compact ? "text-xs" : "text-sm md:-mt-2"}`}
          ></Alert>
        )}
        {signingSession.state === "cancelled" && alerts && (
          <Alert
            title="Le document a été refusé"
            theme="danger"
            icon="CheckCircleIcon"
            className={`p-0 ${compact ? "text-xs" : "text-sm md:-mt-2"}`}
          ></Alert>
        )}
      </div>
    </div>
  );
};
