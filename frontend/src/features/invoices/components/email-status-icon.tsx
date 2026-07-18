import { Badge, Tooltip } from "@radix-ui/themes";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/16/solid";
import { Invoices } from "../types/types";

const failedTooltip = (
  stateDetails: Invoices["state_details"],
  status: "partial" | "failed"
) => {
  const failed = stateDetails?.email_failed_recipients || [];
  return status === "partial"
    ? "Le document n'a pas pu être envoyé à certains destinataires : " +
        failed.join(", ")
    : "Le document n'a pas pu être envoyé : " + failed.join(", ");
};

/**
 * Small tri-state indicator for the email delivery status of a document:
 *   green  "received" -> reached the recipient's mailbox (pixel fetched, or the
 *                        signing link was opened). Not "opened by a human".
 *   blue   "sent"     -> sent, delivery not yet confirmed.
 *   red    "partial"/"failed" -> a confirmed send failure.
 * Renders nothing when nothing has been sent yet.
 */
export const EmailStatusIcon = ({
  stateDetails,
  className = "h-4 w-4 shrink-0",
}: {
  stateDetails?: Invoices["state_details"];
  className?: string;
}) => {
  const status = stateDetails?.email_status;
  if (!status) return null;

  if (status === "received") {
    return (
      <Tooltip content="Arrivé dans la boîte du destinataire">
        <CheckCircleIcon className={className + " text-green-500"} />
      </Tooltip>
    );
  }

  if (status === "sent") {
    return (
      <Tooltip content="Envoyé — réception pas encore confirmée">
        <PaperAirplaneIcon className={className + " text-blue-500"} />
      </Tooltip>
    );
  }

  return (
    <Tooltip content={failedTooltip(stateDetails, status)}>
      <ExclamationCircleIcon className={className + " text-red-500"} />
    </Tooltip>
  );
};

/**
 * Same tri-state as EmailStatusIcon, rendered as a labelled Radix Badge for
 * detail pages (where a bit of text alongside the icon reads better).
 */
export const EmailStatusBadge = ({
  stateDetails,
  className = "ml-2",
}: {
  stateDetails?: Invoices["state_details"];
  className?: string;
}) => {
  const status = stateDetails?.email_status;
  if (!status) return null;

  const iconClassName = "h-3 w-3 inline-block mr-1 -mt-0.5";

  if (status === "received") {
    return (
      <Tooltip content="Arrivé dans la boîte du destinataire">
        <Badge className={className} variant="soft" color="green" size="2">
          <CheckCircleIcon className={iconClassName} />
          Reçu
        </Badge>
      </Tooltip>
    );
  }

  if (status === "sent") {
    return (
      <Tooltip content="Envoyé — réception pas encore confirmée">
        <Badge className={className} variant="soft" color="blue" size="2">
          <PaperAirplaneIcon className={iconClassName} />
          Envoyé
        </Badge>
      </Tooltip>
    );
  }

  return (
    <Tooltip content={failedTooltip(stateDetails, status)}>
      <Badge className={className} variant="soft" color="red" size="2">
        <ExclamationCircleIcon className={iconClassName} />
        {status === "partial" ? "Envoi partiel" : "Problème d'envoi"}
      </Badge>
    </Tooltip>
  );
};
