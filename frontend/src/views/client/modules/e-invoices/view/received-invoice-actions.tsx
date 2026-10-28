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
import {
  CheckIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  PrinterIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import toast from "react-hot-toast";
import { getRoute, ROUTES } from "@/features/routes";
import { withModel } from "@/components/search-bar/utils/as-model";
import { useNavigateAlt } from "@/features/utils/navigate";
import Link from "@atoms/link";
import { Modal, ModalContent } from "@atoms/modal/modal";
import { RestDocumentsInput } from "@components/input-rest";
import { getArticleIcon } from "@views/client/modules/articles/components/article-icon";
import { getUnitLabel } from "@atoms/input/input-unit";
import { useInvoiceMaps } from "@features/invoices/hooks/use-invoice-maps";
import { normalizeUnitCode } from "@shared/consts";
import { useTranslation } from "react-i18next";
import { printReceivedEInvoice } from "./received-invoice-print";

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
  const { t } = useTranslation();
  const { maps } = useInvoiceMaps();
  // Set when some lines match no article, until the user confirms the default article
  const [pendingCreation, setPendingCreation] = useState<{
    asQuote: boolean;
  } | null>(null);
  const [defaultArticleId, setDefaultArticleId] = useState("");

  const canProcessInvoice = supplier && isSupplierValid && areArticlesValid;

  const unmatchedLines = (invoice.en_invoice?.lines || []).filter(
    (line) => !articleMatches[line.identifier],
  );

  const handleReject = () => {
    if (!id) return;
    update.mutate({
      id,
      state: "rejected",
    });
  };

  const handlePrint = () =>
    printReceivedEInvoice(invoice, (code) => {
      const unit = maps?.units?.[normalizeUnitCode(code)];
      return unit ? getUnitLabel(unit, t) : code;
    });

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

  const handleCreate = (asQuote: boolean = true) => {
    if (!id || isCreating || !canProcessInvoice || !supplier) return;
    if (unmatchedLines.length) {
      setDefaultArticleId(client?.service_items?.unknown_article || "");
      setPendingCreation({ asQuote });
      return;
    }
    convert(asQuote);
  };

  const convert = async (asQuote: boolean, defaultArticle?: string) => {
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
            default_article_id: defaultArticle || "",
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
        <Button
          theme="outlined"
          onClick={handlePrint}
          icon={(p) => <PrinterIcon {...p} />}
        >
          Imprimer
        </Button>
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
            confirmTitle="Ignorer la facture électronique ?"
            confirmMessage="La facture sera simplement rangée dans l'onglet « Ignorées » (doublon, facture qui ne vous concerne pas...). Le fournisseur n'est pas prévenu et aucun refus n'est transmis à la plateforme de facturation électronique. Vous pourrez la traiter plus tard si nécessaire."
            confirmButtonTheme="danger"
            confirmButtonText="Ignorer"
          >
            Ignorer
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

      <Modal open={!!pendingCreation} onClose={() => setPendingCreation(null)}>
        <ModalContent
          icon={ExclamationTriangleIcon}
          theme="warning"
          title="Lignes sans article correspondant"
          text={`${unmatchedLines.length > 1 ? `${unmatchedLines.length} lignes ne correspondent` : "Une ligne ne correspond"} à aucun article de votre catalogue. Elles peuvent être créées avec l'article par défaut : le libellé, la quantité et le prix de la facture sont conservés, mais elles ne seront pas liées au stock.`}
        >
          <ul className="mt-4 space-y-1 text-sm max-h-48 overflow-y-auto">
            {unmatchedLines.map((line) => (
              <li key={line.identifier} className="flex justify-between gap-2">
                <span className="truncate">{line.item_information.name}</span>
                {line.item_information.seller_identifier && (
                  <span className="text-slate-500 shrink-0">
                    Réf. {line.item_information.seller_identifier}
                  </span>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-4">
            <RestDocumentsInput
              label="Article par défaut"
              placeholder="Sélectionner un article"
              entity="articles"
              size="lg"
              value={defaultArticleId}
              onChange={(value: string) => setDefaultArticleId(value || "")}
              icon={(p, article) =>
                getArticleIcon((article as Articles)?.type)(p)
              }
            />
            {!client?.service_items?.unknown_article && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Vous pouvez définir l'article utilisé par défaut dans{" "}
                <Link to={getRoute(ROUTES.SettingsStockServices)}>
                  Paramètres &gt; Stock et services
                </Link>
                .
              </p>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button theme="outlined" onClick={() => setPendingCreation(null)}>
              Annuler
            </Button>
            <Button
              disabled={!defaultArticleId}
              onClick={() => {
                const asQuote = pendingCreation?.asQuote ?? true;
                setPendingCreation(null);
                convert(asQuote, defaultArticleId);
              }}
            >
              Créer avec l'article par défaut
            </Button>
          </div>
        </ModalContent>
      </Modal>
    </>
  );
};
