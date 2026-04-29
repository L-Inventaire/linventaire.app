import { ReceivedEInvoices } from "@/features/e-invoicing/types/types";
import { useInvoices } from "@/features/invoices/hooks/use-invoices";
import { Invoices } from "@/features/invoices/types/types";
import { formatNumber } from "@/features/utils/format/strings";
import { buildQueryFromMap } from "@/components/search-bar/utils/utils";
import { getInvoiceStatusPrettyName } from "@/views/client/modules/invoices/utils";
import { Modal } from "@/atoms/modal/modal";
import { Button } from "@/atoms/button/button";
import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const AttachInvoiceDialog = ({
  invoice,
  onClose,
  onAttach,
}: {
  invoice: ReceivedEInvoices;
  onClose: () => void;
  onAttach: (invoiceId: string) => void;
}) => {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    null,
  );

  // Search for invoices with similar amount (±10%)
  const minAmount = invoice.total_amount_with_tax * 0.9;
  const maxAmount = invoice.total_amount_with_tax * 1.1;

  const { invoices } = useInvoices({
    query: [
      ...buildQueryFromMap({
        type: ["supplier_invoices", "supplier_credit_notes"],
      }),
      {
        key: "total.total_with_taxes",
        values: [
          { value: minAmount, op: "gte" },
          { value: maxAmount, op: "lte" },
        ],
      },
    ],
    limit: 20,
    offset: 0,
    key: "attach-invoice-dialog",
  });

  const handleAttach = () => {
    if (selectedInvoiceId) {
      onAttach(selectedInvoiceId);
    }
  };

  return (
    <Modal open onClose={onClose}>
      <div className="w-[800px] max-w-[90vw]">
        <div className="mb-6">
          <h3 className="text-xl font-semibold leading-6 text-gray-900 dark:text-white mb-2">
            Rattacher à une facture existante
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sélectionnez la facture fournisseur correspondant à cette facture
            électronique. Les factures affichées ont un montant similaire
            (±10%).
          </p>
        </div>

        <div className="max-h-[60vh] overflow-y-auto py-2">
          {invoices?.data?.list && invoices.data.list.length > 0 ? (
            <div className="space-y-2">
              {invoices.data.list.map((inv: Invoices) => (
                <div
                  key={inv.id}
                  onClick={() => setSelectedInvoiceId(inv.id)}
                  className={`
                    p-4 border rounded-lg cursor-pointer transition-colors
                    ${
                      selectedInvoiceId === inv.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    }
                  `}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {inv.reference}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {getInvoiceStatusPrettyName(inv.state, inv.type)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {inv.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        {format(new Date(inv.emit_date), "dd MMMM yyyy", {
                          locale: fr,
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {formatNumber(inv.total?.total_with_taxes || 0)}{" "}
                        {inv.currency}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        HT: {formatNumber(inv.total?.total || 0)} {inv.currency}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <p>
                Aucune facture fournisseur trouvée avec un montant similaire.
              </p>
              <p className="text-sm mt-2">
                Montant recherché: {formatNumber(invoice.total_amount_with_tax)}{" "}
                {invoice.currency_code}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button theme="outlined" onClick={onClose}>
            Annuler
          </Button>
          <Button
            theme="primary"
            onClick={handleAttach}
            disabled={!selectedInvoiceId}
          >
            Rattacher
          </Button>
        </div>
      </div>
    </Modal>
  );
};
