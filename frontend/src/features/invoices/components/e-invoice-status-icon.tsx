import { Tooltip } from "@radix-ui/themes";
import { DocumentCheckIcon } from "@heroicons/react/16/solid";
import { formatDate } from "@features/utils/format/dates";
import { Invoices } from "../types/types";

/**
 * Green indicator shown once the document was transmitted to the e-invoicing
 * platform (SuperPDP). The transmission happens whenever e-invoicing is
 * connected, whether or not sending is enforced in the settings. Failures are
 * reported in the timeline (with a notification), not here.
 * Renders nothing when the document was not transmitted.
 */
export const EInvoiceStatusIcon = ({
  eInvoice,
  className = "h-4 w-4 shrink-0",
}: {
  eInvoice?: Invoices["e_invoice"];
  className?: string;
}) => {
  if (eInvoice?.status !== "uploaded") return null;

  return (
    <Tooltip
      content={
        "Envoyé en facture électronique le " + formatDate(eInvoice.sent_at)
      }
    >
      <DocumentCheckIcon className={className + " text-green-500"} />
    </Tooltip>
  );
};
