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
} & React.ComponentProps<"div">;

export const TitleBar = ({
  signingSession,
  invoice,
  alerts,
  ...props
}: TitleBarProps) => {
  return (
    <div
      className={twMerge("w-full mt-6 flex", props.className)}
      {..._.omit(props, "className")}
    >
      <div className="w-full h-full">
        <div className="flex items-center">
          <img
            className="h-6 w-auto dark:hidden"
            src="/medias/logo.png"
            alt="L'inventaire"
          />
          <img
            className="mx-auto h-6 w-auto hidden dark:block"
            src="/medias/logo.svg"
            alt="L'inventaire"
          />
          <Section className="m-0 ml-2 font-normal">L'inventaire</Section>
        </div>
        <Info>
          {signingSession.state === "signed" && "Signé par:"}{" "}
          {signingSession.recipient_email}
        </Info>
      </div>

      <div className="flex flex-col w-full items-center">
        <Title>
          {invoice?.type === "invoices" ? "Facture" : "Devis"}{" "}
          {invoice?.reference}
        </Title>
      </div>
      <div className="w-full">
        {signingSession.expired && signingSession.state !== "cancelled" && (
          <Alert
            title="Document expiré"
            theme="warning"
            icon="CheckCircleIcon"
            className="p-0 -mt-2"
          ></Alert>
        )}
        {signingSession.state === "signed" && alerts && (
          <Alert
            title="Le document a déjà été signé"
            theme="warning"
            icon="CheckCircleIcon"
            className="p-0 -mt-2"
          ></Alert>
        )}
        {signingSession.state === "sent" && alerts && (
          <Alert
            title="La session de signature a été démarrée"
            theme="warning"
            icon="CheckCircleIcon"
            className="p-0 -mt-2"
          ></Alert>
        )}
        {signingSession.state === "cancelled" && alerts && (
          <Alert
            title="Le document a été refusé"
            theme="danger"
            icon="CheckCircleIcon"
            className="p-0 -mt-2"
          ></Alert>
        )}
      </div>
    </div>
  );
};
