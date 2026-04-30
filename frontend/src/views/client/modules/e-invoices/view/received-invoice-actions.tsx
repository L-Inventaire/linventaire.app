import { Button } from "@/atoms/button/button";
import { ButtonConfirm } from "@/atoms/button/confirm";
import { useCurrentClient } from "@/features/clients/state/use-clients";
import { Contacts } from "@/features/contacts/types/types";
import { useCtrlKAsSelect } from "@/features/ctrlk/use-ctrlk-as-select";
import { ReceivedEInvoices } from "@/features/e-invoicing/types/types";
import { Invoices } from "@/features/invoices/types/types";
import { fetchServer } from "@/features/utils/fetch-server";
import { useRest } from "@/features/utils/rest/hooks/use-rest";
import { ArrowLeftIcon } from "@heroicons/react/16/solid";
import { CheckIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import toast from "react-hot-toast";

export const ReceivedEInvoiceActions = ({
  id,
  invoice,
  supplier,
  isSupplierValid,
}: {
  id: string | undefined;
  invoice: ReceivedEInvoices;
  supplier: Contacts | null;
  isSupplierValid: boolean;
}) => {
  const { update } = useRest<ReceivedEInvoices>("received_e_invoices");
  const select = useCtrlKAsSelect();
  const { client } = useCurrentClient();
  const [isCreating, setIsCreating] = useState(false);

  const canProcessInvoice = supplier && isSupplierValid;

  const handleReject = () => {
    if (!id) return;
    update.mutate({
      id,
      state: "rejected",
    });
  };

  const handleDeattach = () => {
    if (!id) return;
    update.mutate({
      id,
      state: "new",
      supplier_invoice_id: "",
    });
  };

  const handleAttach = () => {
    if (!id || !canProcessInvoice || !supplier) return;

    // Search for supplier invoices with similar amount (±10%)
    const minAmount = Math.floor(invoice.total_amount_with_tax);
    const maxAmount = Math.floor(invoice.total_amount_with_tax + 1);

    select<Invoices>(
      "invoices",
      {
        type: ["supplier_invoices", "supplier_credit_notes"],
        supplier: supplier.id,
      },
      (selectedInvoices: Invoices[]) => {
        if (selectedInvoices.length === 0) return;

        const selectedInvoice = selectedInvoices[0];
        update.mutate({
          id,
          state: "attached",
          supplier_invoice_id: selectedInvoice.id,
        });
      },
      1,
      [],
      {
        query: `total.total_with_taxes:${minAmount}->${maxAmount}`,
      },
    );
  };

  const handleCreate = async () => {
    if (!id || isCreating || !canProcessInvoice || !supplier) return;

    setIsCreating(true);
    try {
      const response = await fetchServer(
        `/api/e-invoices/v1/${client?.id}/received/${id}/convert`,
        {
          method: "POST",
          body: JSON.stringify({
            supplier_id: supplier.id,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.includes("No matching supplier")) {
          toast.error(
            "Aucun fournisseur correspondant trouvé. Veuillez créer d'abord le contact fournisseur.",
          );
        } else {
          toast.error(`Erreur: ${data.error || "Une erreur est survenue"}`);
        }
        return;
      }
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      toast.error("Une erreur est survenue lors de la création de la facture");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <div className="flex justify-end gap-2">
        {invoice.state !== "new" && (
          <Button
            theme="outlined"
            onClick={handleDeattach}
            icon={(p) => <ArrowLeftIcon {...p} />}
          >
            Retourner en "Nouveau"
          </Button>
        )}
        {invoice.state !== "rejected" && (
          <ButtonConfirm
            theme="outlined"
            onClick={handleReject}
            icon={(p) => <XMarkIcon {...p} />}
            confirmTitle="Rejeter la facture électronique ?"
            confirmMessage="Cette action marquera la facture comme rejetée. Vous pourrez la traiter à nouveau plus tard si nécessaire."
            confirmButtonTheme="danger"
            confirmButtonText="Rejeter"
          >
            Rejeter
          </ButtonConfirm>
        )}
        {invoice.state !== "attached" && (
          <>
            <Button
              theme="outlined"
              onClick={handleAttach}
              icon={(p) => <CheckIcon {...p} />}
              disabled={!canProcessInvoice}
            >
              Rattacher
            </Button>
            <Button
              theme="primary"
              onClick={handleCreate}
              icon={(p) => <PlusIcon {...p} />}
              disabled={isCreating || !canProcessInvoice}
            >
              {isCreating ? "Création..." : "Créer"}
            </Button>
          </>
        )}
      </div>
    </>
  );
};
