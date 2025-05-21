import { Button } from "@atoms/button/button";
import { DropdownButton } from "@atoms/dropdown";
import { withModel } from "@components/search-bar/utils/as-model";
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
import { useSetRecoilState } from "recoil";
import { getPdfPreview } from "../../invoices-preview/invoices-preview";
import { InvoiceSendModalAtom } from "../modal-send";
import { useEditFromCtrlK } from "@features/ctrlk/use-edit-from-ctrlk";
import { AccountingTransactions } from "@features/accounting/types/types";
import { InvoiceSendSpecialModalAtom } from "../modal-send-special";
import _ from "lodash";

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

  const { draft, save: _save } = useReadDraftRest<Invoices>(
    "invoices",
    id || "new"
  );
  const disabled =
    readonly || draft.state === "closed" || draft.state === "completed";

  const edit = useEditFromCtrlK();

  const commonOptions = [
    {
      label: "Accusé de réception...",
      onClick: () => {
        openSendSpecialModal("receipt_acknowledgement");
      },
    },
    {
      label: "Bon de livraison...",
      onClick: () => {
        openSendSpecialModal("delivery_slip");
      },
    },
  ];

  return (
    <>
      {draft.state === "draft" && (
        <>
          <DropdownButton
            disabled={disabled}
            className="m-0"
            size="lg"
            icon={(p) => <PaperAirplaneIcon {...p} />}
            position="top"
            menu={[
              {
                label: "Proforma...",
                onClick: () => {
                  openSendSpecialModal("proforma");
                },
              },
              ...commonOptions,
              {
                type: "divider",
              },
              {
                label: "Envoyer par email...",
                icon: (p) => <PaperAirplaneIcon {...p} />,
                onClick: () => openSendModal(true),
              },
              {
                type: "divider",
              },
              {
                label: "Télécharger le PDF",
                icon: (p) => <PrinterIcon {...p} />,
                onClick: () => getPdfPreview(draft),
              },
              {
                label: "Marquer comme envoyé",
                icon: (p) => <CheckIcon {...p} />,
                onClick: () => _save({ state: "sent" }),
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
              },
              {
                label: "Télécharger en PDF",
                onClick: () => getPdfPreview(draft),
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
                        "reference_preferred_value"
                      ),
                      from_rel_quote: [draft.id],
                      type: "supplier_quotes",
                      state: "draft",
                      id: "",
                    }),
                    { event }
                  ),
              },
            ]}
          />
          <Button
            disabled={disabled}
            size="lg"
            icon={(p) => <CheckIcon {...p} />}
            onClick={() => {
              edit<AccountingTransactions>("accounting_transactions", "", {
                rel_invoices: [draft.id],
                currency: draft.currency,
                amount: draft.total?.total_with_taxes || 0,
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
            size="lg"
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
          <Button disabled={true} size="lg">
            Document fermé
          </Button>
        </>
      )}
      {draft.state === "completed" && (
        <>
          <DropdownButton
            theme="invisible"
            size="lg"
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
          <Button disabled={true} size="lg">
            Facture payée et cloturée
          </Button>
        </>
      )}
    </>
  );
};
