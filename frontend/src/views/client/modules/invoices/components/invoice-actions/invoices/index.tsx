import { useEInvoicingConfig } from "@/features/e-invoicing/hooks/use-e-invoicing-config";
import { Button } from "@atoms/button/button";
import { DropdownButton } from "@atoms/dropdown";
import { withModel } from "@components/search-bar/utils/as-model";
import { AccountingTransactions } from "@features/accounting/types/types";
import { useEditFromCtrlK } from "@features/ctrlk/use-edit-from-ctrlk";
import { Invoices } from "@features/invoices/types/types";
import { getRoute, ROUTES } from "@features/routes";
import { useNavigateAlt } from "@features/utils/navigate";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import {
  CheckIcon,
  EllipsisHorizontalIcon,
  PaperAirplaneIcon,
  PrinterIcon,
} from "@heroicons/react/16/solid";
import _ from "lodash";
import { useSetRecoilState } from "recoil";
import { getPdfPreview } from "../../invoices-preview/invoices-preview";
import { InvoiceSendModalAtom } from "../modal-send";
import { InvoiceSendSpecialModalAtom } from "../modal-send-special";

export const InvoicesActions = ({
  id,
  readonly,
}: {
  id?: string;
  readonly?: boolean;
}) => {
  const navigate = useNavigateAlt();
  const openSendModal = useSetRecoilState(InvoiceSendModalAtom);
  const openSendSpecialModal = useSetRecoilState(InvoiceSendSpecialModalAtom);
  const { config: eInvoicingConfig } = useEInvoicingConfig();

  const { draft, save: _save } = useReadDraftRest<Invoices>(
    "invoices",
    id || "new",
    readonly,
  );
  const disabled =
    readonly || draft.state === "closed" || draft.state === "completed";

  const canSend = !!draft?.en16931 || !eInvoicingConfig?.send_enabled;
  const en16931Warning = !draft?.en16931;

  const edit = useEditFromCtrlK();

  const commonOptions = [
    {
      label: "Accusé de réception...",
      onClick: () => {
        openSendSpecialModal("receipt_acknowledgement");
      },
      disabled: !canSend,
    },
    {
      label: "Bon de livraison...",
      onClick: () => {
        openSendSpecialModal("delivery_slip");
      },
      disabled: !canSend,
    },
  ];

  return (
    <>
      {!!en16931Warning && (
        <div className="text-sm text-red-500">
          Impossible de compiler en e-facture pour l'envoi.
        </div>
      )}
      {draft.state === "draft" && (
        <>
          <DropdownButton
            disabled={disabled || !canSend}
            className="m-0"
            icon={(p) => <PaperAirplaneIcon {...p} />}
            position="top"
            menu={[
              {
                label: "Proforma...",
                onClick: () => {
                  openSendSpecialModal("proforma");
                },
                disabled: !canSend,
              },
              ...commonOptions,
              {
                type: "divider",
              },
              {
                label: "Envoyer par email...",
                icon: (p) => <PaperAirplaneIcon {...p} />,
                onClick: () => openSendModal(true),
                disabled: !canSend,
              },
              {
                type: "divider",
              },
              {
                label: "Télécharger le PDF",
                icon: (p) => <PrinterIcon {...p} />,
                onClick: () => getPdfPreview(draft),
                disabled: !canSend,
              },
              {
                label: "Marquer comme envoyé",
                icon: (p) => <CheckIcon {...p} />,
                onClick: () => _save({ state: "sent" }),
                disabled: !canSend,
              },
            ]}
          >
            Envoyer
          </DropdownButton>
        </>
      )}

      {draft.state === "sent" && (
        <>
          <DropdownButton
            className="m-0"
            theme="invisible"
            icon={(p) => <EllipsisHorizontalIcon {...p} />}
            menu={[
              ...commonOptions,
              {
                type: "divider",
              },
              {
                label: "Retourner en brouillon",
                onClick: () => _save({ state: "draft" }),
              },
              {
                type: "divider",
              },
              {
                label: "Envoyer de nouveau...",
                onClick: () => openSendModal(true),
                disabled: !canSend,
              },
              {
                label: "Télécharger en PDF",
                onClick: () => getPdfPreview(draft),
                disabled: !canSend,
              },
              {
                label: "Créer une commande",
                onClick: (event) =>
                  navigate(
                    withModel(getRoute(ROUTES.InvoicesEdit, { id: "new" }), {
                      ..._.omit(
                        draft,
                        "id",
                        "emit_date",
                        "reference_preferred_value",
                      ),
                      from_rel_quote: [draft.id],
                      type: "supplier_quotes",
                      state: "draft",
                      id: "",
                    }),
                    { event },
                  ),
              },
            ]}
          />
          <Button
            disabled={disabled}
            icon={(p) => <CheckIcon {...p} />}
            onClick={() => {
              edit<AccountingTransactions>("accounting_transactions", "", {
                rel_invoices: [draft.id],
                currency: draft.currency,
                amount:
                  (draft.total?.total_with_taxes || 0) -
                  (draft.transactions?.total || 0),
                reference: draft.reference,
              });
            }}
          >
            Enregistrer un paiement
          </Button>
        </>
      )}

      {draft.state === "closed" && (
        <>
          <DropdownButton
            theme="invisible"
            className="m-0"
            icon={(p) => <EllipsisHorizontalIcon {...p} />}
            menu={[
              ...commonOptions,
              {
                label: "Re-ouvrir la facture",
                onClick: () => _save({ state: "sent" }),
              },
            ]}
          />
          <Button disabled={true}>Document fermé</Button>
        </>
      )}
      {draft.state === "completed" && (
        <>
          <DropdownButton
            theme="invisible"
            className="m-0"
            icon={(p) => <EllipsisHorizontalIcon {...p} />}
            menu={[
              ...commonOptions,
              {
                label: "Re-ouvrir la facture",
                onClick: () => _save({ state: "sent" }),
              },
            ]}
          />
          <Button disabled={true}>Facture payée et cloturée</Button>
        </>
      )}
    </>
  );
};
