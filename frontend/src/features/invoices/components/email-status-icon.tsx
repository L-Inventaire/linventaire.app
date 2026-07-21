import { Tooltip } from "@radix-ui/themes";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/16/solid";
import { Invoices } from "../types/types";

const failedTooltip = (
  stateDetails: Invoices["state_details"],
  status: "partial" | "failed",
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

export type RecipientDeliveryStatus = "sent" | "received" | "failed";

/**
 * Per-recipient delivery status, derived from the document's state_details:
 *   - "failed"   -> this recipient was rejected by the mail server.
 *   - "received" -> this recipient's delivery was confirmed — their tracking
 *                   pixel was fetched, or they opened their signing link.
 *   - "sent"     -> sent, delivery not yet confirmed (the default for a
 *                   recipient we haven't heard back about).
 *
 * Falls back to the document-level "received" aggregate only for documents sent
 * before per-recipient tracking existed (no email_received_recipients recorded),
 * so their dots still turn green.
 */
export const recipientDeliveryStatus = (
  email: string,
  stateDetails?: Invoices["state_details"],
): RecipientDeliveryStatus => {
  if ((stateDetails?.email_failed_recipients || []).includes(email)) {
    return "failed";
  }
  const received = stateDetails?.email_received_recipients || [];
  if (received.includes(email)) return "received";
  if (received.length === 0 && stateDetails?.email_status === "received") {
    return "received";
  }
  return "sent";
};

const recipientDot: Record<
  RecipientDeliveryStatus,
  { color: string; tooltip: string }
> = {
  received: {
    color: "bg-green-500",
    tooltip: "Arrivé dans la boîte du destinataire",
  },
  sent: {
    color: "bg-blue-500",
    tooltip: "Envoyé",
  },
  failed: {
    color: "bg-red-500",
    tooltip: "Le document n'a pas pu être envoyé à ce destinataire",
  },
};

/**
 * Small coloured dot shown next to a recipient in the timeline, echoing the
 * document's email delivery status for that specific recipient.
 */
export const RecipientStatusDot = ({
  status,
  className = "",
}: {
  status: RecipientDeliveryStatus;
  className?: string;
}) => {
  const { color, tooltip } = recipientDot[status];
  return (
    <Tooltip content={tooltip}>
      <span
        className={
          "inline-block h-2 w-2 rounded-full mr-0.5 align-middle " +
          color +
          (className ? " " + className : "")
        }
      />
    </Tooltip>
  );
};
