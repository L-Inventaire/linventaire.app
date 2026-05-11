import { Button } from "@/atoms/button/button";
import { ButtonConfirm } from "@/atoms/button/confirm";
import { DropdownButton } from "@atoms/dropdown";
import { useCurrentClient } from "@/features/clients/state/use-clients";
import { Articles } from "@/features/articles/types/types";
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
import { getRoute, ROUTES } from "@/features/routes";
import { withModel } from "@/components/search-bar/utils/as-model";
import { useNavigateAlt } from "@/features/utils/navigate";

export const ReceivedEInvoiceActions = ({
  id,
  invoice,
  supplier,
  isSupplierValid,
  areArticlesValid,
  articleMatches,
}: {
  id: string | undefined;
  invoice: ReceivedEInvoices;
  supplier: Contacts | null;
  isSupplierValid: boolean;
  areArticlesValid: boolean;
  articleMatches: Record<string, Articles | null>;
}) => {
  const { update } = useRest<ReceivedEInvoices>("received_e_invoices");
  const select = useCtrlKAsSelect();
  const { client } = useCurrentClient();
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigateAlt();

  const canProcessInvoice = supplier && isSupplierValid && areArticlesValid;

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

  const handleCreate = async (asQuote: boolean = true) => {
    if (!id || isCreating || !canProcessInvoice || !supplier) return;

    setIsCreating(true);
    try {
      // Prepare article mappings (line_number -> article_id)
      const article_mappings: Record<string, string> = {};
      Object.entries(articleMatches).forEach(([lineNumber, article]) => {
        if (article) {
          article_mappings[lineNumber] = article.id;
        }
      });

      const response = await fetchServer(
        `/api/e-invoices/v1/${client?.id}/received/${id}/convert`,
        {
          method: "POST",
          body: JSON.stringify({
            supplier_id: supplier.id,
            article_mappings,
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

      navigate(
        withModel<Invoices>(getRoute(ROUTES.InvoicesEdit, { id: "new" }), {
          ...data.invoice,
          ...(asQuote ? { type: "supplier_quotes" } : {}),
        }),
      );
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
            <DropdownButton
              theme="primary"
              icon={(p) => <PlusIcon {...p} />}
              disabled={isCreating || !canProcessInvoice}
              position="top"
              menu={[
                {
                  label: "Créer une commande",
                  onClick: () => handleCreate(true),
                },
                {
                  label: "Créer une facture",
                  onClick: () => handleCreate(false),
                },
              ]}
            >
              {isCreating ? "Création..." : "Créer"}
            </DropdownButton>
          </>
        )}
      </div>
    </>
  );
};
