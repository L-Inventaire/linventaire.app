import { Badge, Button, Tooltip } from "@radix-ui/themes";
import {
  ArrowPathIcon,
  ClockIcon,
  DocumentCheckIcon,
  DocumentMinusIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/16/solid";
import { formatDate } from "@features/utils/format/dates";
import { Invoices } from "../types/types";
import { InvoicesApiClient } from "../api-client/invoices-api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";

type EInvoice = Invoices["e_invoice"];

/** Labels of e_invoice.status, also used by the search filter */
export const EInvoiceStatusLabels: Record<string, string> = {
  "": "Non transmis",
  pending: "En cours d'envoi",
  sending: "En cours d'envoi",
  uploaded: "Envoyé",
  failed: "Échec",
  skipped: "Non concerné",
};

const getEInvoiceDisplay = (eInvoice: EInvoice) => {
  const at = eInvoice?.sent_at ? " le " + formatDate(eInvoice.sent_at) : "";
  switch (eInvoice?.status) {
    case "uploaded":
      return {
        Icon: DocumentCheckIcon,
        color: "green" as const,
        className: "text-green-500",
        label: "Envoyé en facture électronique",
        tooltip:
          "Envoyé en facture électronique" +
          at +
          (eInvoice.superpdp_id ? ` (SuperPDP #${eInvoice.superpdp_id})` : ""),
      };
    case "failed":
      return {
        Icon: ExclamationTriangleIcon,
        color: "red" as const,
        className: "text-red-500",
        label: "Échec de la facture électronique",
        tooltip:
          "Échec de l'envoi en facture électronique" +
          at +
          (eInvoice.error ? " : " + eInvoice.error : ""),
      };
    case "pending":
    case "sending":
      return {
        Icon: ClockIcon,
        color: "gray" as const,
        className: "text-slate-400",
        label: "Facture électronique en cours d'envoi",
        tooltip: "Facture électronique en cours d'envoi",
      };
    case "skipped":
      return {
        Icon: DocumentMinusIcon,
        color: "gray" as const,
        className: "text-slate-400",
        label: "Non concerné par la facture électronique",
        tooltip:
          eInvoice.error ||
          "Document non concerné par la facturation électronique",
      };
    default:
      return null;
  }
};

/**
 * Indicator of the transmission to the e-invoicing platform (SuperPDP):
 * sent (green), failed (red), in progress or not concerned (gray).
 * Renders nothing when the document was not transmitted (sending disabled,
 * draft or older document). Failures are also reported in the timeline.
 */
export const EInvoiceStatusIcon = ({
  eInvoice,
  className = "h-4 w-4 shrink-0",
}: {
  eInvoice?: EInvoice;
  className?: string;
}) => {
  const display = getEInvoiceDisplay(eInvoice);
  if (!display) return null;
  const { Icon } = display;

  return (
    <Tooltip content={display.tooltip}>
      <Icon className={className + " " + display.className} />
    </Tooltip>
  );
};

/** Same information as a badge, for the document page */
export const EInvoiceStatusBadge = ({
  eInvoice,
  className,
}: {
  eInvoice?: EInvoice;
  className?: string;
}) => {
  const display = getEInvoiceDisplay(eInvoice);
  if (!display) return null;
  const { Icon } = display;

  return (
    <Tooltip content={display.tooltip}>
      <Badge
        className={className}
        variant="outline"
        color={display.color}
        size="2"
      >
        <Icon className="h-3 w-3 inline-block mr-1 -mt-0.5" />
        {display.label}
      </Badge>
    </Tooltip>
  );
};

/**
 * Discreet button next to the failed badge: transmits the document again
 * (only a failed transmission can be retried, the server refuses otherwise)
 */
export const EInvoiceRetryButton = ({
  invoice,
  className,
}: {
  invoice: Pick<Invoices, "id" | "client_id" | "e_invoice">;
  className?: string;
}) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  if (invoice.e_invoice?.status !== "failed") return null;

  return (
    <Tooltip content="Renvoyer la facture électronique">
      <Button
        className={className}
        size="1"
        variant="ghost"
        color="red"
        loading={loading}
        onClick={async () => {
          setLoading(true);
          try {
            const { e_invoice } =
              await InvoicesApiClient.retryEInvoice(invoice);
            if (e_invoice?.status === "uploaded") {
              toast.success("Facture électronique envoyée");
            } else if (e_invoice?.status === "failed") {
              toast.error("Nouvel échec de la facture électronique");
            }
          } catch (e: any) {
            toast.error(e?.message || "Erreur lors du renvoi");
          } finally {
            setLoading(false);
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
          }
        }}
      >
        <ArrowPathIcon className="h-3 w-3" />
        Réessayer
      </Button>
    </Tooltip>
  );
};
