import { ReceivedEInvoices } from "@/features/e-invoicing/types/types";
import { getRoute, ROUTES } from "@/features/routes";
import { useNavigateAlt } from "@/features/utils/navigate";
import { useRest } from "@/features/utils/rest/hooks/use-rest";
import { CheckIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/atoms/button/button";
import { ButtonConfirm } from "@/atoms/button/confirm";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AttachInvoiceDialog } from "./attach-invoice-dialog";

export const ReceivedEInvoiceActions = ({
  id,
  invoice,
}: {
  id: string | undefined;
  invoice: ReceivedEInvoices;
}) => {
  const navigate = useNavigateAlt();
  const queryClient = useQueryClient();
  const { update } = useRest<ReceivedEInvoices>("received_e_invoices");
  const [showAttachDialog, setShowAttachDialog] = useState(false);

  const handleReject = () => {
    if (!id) return;

    update.mutate(
      {
        id,
        state: "rejected",
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["received_e_invoices"],
          });
          navigate(getRoute(ROUTES.ReceivedEInvoices));
        },
      },
    );
  };

  const handleAttach = (invoiceId: string) => {
    if (!id) return;

    update.mutate(
      {
        id,
        state: "attached",
        supplier_invoice_id: invoiceId,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["received_e_invoices"],
          });
          setShowAttachDialog(false);
          navigate(getRoute(ROUTES.ReceivedEInvoices));
        },
      },
    );
  };

  const handleCreate = () => {
    // TODO: Implement create action
    console.log("Create invoice from received e-invoice");
  };

  return (
    <>
      <div className="flex justify-end gap-2">
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
        <Button
          theme="outlined"
          onClick={() => setShowAttachDialog(true)}
          icon={(p) => <CheckIcon {...p} />}
        >
          Rattacher
        </Button>
        <Button
          theme="primary"
          onClick={handleCreate}
          icon={(p) => <PlusIcon {...p} />}
        >
          Créer
        </Button>
      </div>

      {showAttachDialog && (
        <AttachInvoiceDialog
          invoice={invoice}
          onClose={() => setShowAttachDialog(false)}
          onAttach={handleAttach}
        />
      )}
    </>
  );
};
