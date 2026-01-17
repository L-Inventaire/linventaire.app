import { Info, Section, Title } from "@atoms/text";
import { SigningSession } from "@features/documents/types";
import { Invoices } from "@features/invoices/types/types";
import { Button } from "@radix-ui/themes";
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
          <Button disabled className={`bg-orange-500 text-white`}>
            Document expiré
          </Button>
        )}
        {signingSession.state === "signed" && alerts && (
          <Button disabled className={`bg-green-500 text-white`}>
            Le document a déjà été signé
          </Button>
        )}
        {signingSession.state === "sent" && alerts && (
          <Button disabled className={`bg-orange-500 text-white`}>
            La session de signature a été démarrée
          </Button>
        )}
        {signingSession.state === "cancelled" && alerts && (
          <Button disabled className={`bg-red-500 text-white`}>
            Le document a été refusé
          </Button>
        )}
      </div>
    </div>
  );
};
