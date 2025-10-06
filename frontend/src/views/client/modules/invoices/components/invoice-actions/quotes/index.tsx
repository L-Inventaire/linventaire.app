import { Button } from "@atoms/button/button";
import { ButtonConfirm } from "@atoms/button/confirm";
import { DropdownButton } from "@atoms/dropdown";
import { withModel } from "@components/search-bar/utils/as-model";
import { Invoices } from "@features/invoices/types/types";
import { getRoute, ROUTES } from "@features/routes";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import {
  ArrowPathIcon,
  CheckIcon,
  DocumentCheckIcon,
  EllipsisHorizontalIcon,
  PaperAirplaneIcon,
  PrinterIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid";
import { getPdfPreview } from "../../invoices-preview/invoices-preview";
import { InvoiceSendModalAtom } from "../modal-send";
import { useSetRecoilState } from "recoil";
import { useNavigateAlt } from "@features/utils/navigate";
import { InvoiceInvoiceModalAtom } from "../modal-invoice";
import { RecurrenceModalAtom } from "../../input-recurrence";
import { useInvoices } from "@features/invoices/hooks/use-invoices";
import { InvoiceSendSpecialModalAtom } from "../modal-send-special";
import _ from "lodash";

export const QuotesActions = ({
  id,
  readonly,
}: {
  id?: string;
  readonly?: boolean;
}) => {
  const navigate = useNavigateAlt();
  const openSendModal = useSetRecoilState(InvoiceSendModalAtom);
  const openInvoiceModal = useSetRecoilState(InvoiceInvoiceModalAtom);
  const openSendSpecialModal = useSetRecoilState(InvoiceSendSpecialModalAtom);

  const { upsert } = useInvoices();
  const { draft, save: _save } = useReadDraftRest<Invoices>(
    "invoices",
    id || "new"
  );
  const disabled = readonly || draft.state === "closed";
  const setRecurringModal = useSetRecoilState(RecurrenceModalAtom);

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
            className="m-0"
            theme="invisible"
            icon={(p) => <EllipsisHorizontalIcon {...p} />}
            menu={[
              {
                label: "Proforma...",
                onClick: () => {
                  openSendSpecialModal("proforma");
                },
              },
              {
                label: "Facturer directement",
                onClick: async () => {
                  if (
                    // TODO: make a better modal
                    window.confirm(
                      "Le devis sera marqué comme accepté par le client et une facture sera créée."
                    )
                  ) {
                    await _save({ state: "purchase_order" });
                    const invoice = await upsert.mutateAsync({
                      ...draft,
                      id: "",
                      from_rel_quote: [draft.id],
                      state: "draft",
                      type: "invoices",
                    });
                    navigate(getRoute(ROUTES.InvoicesView, { id: invoice.id }));
                  }
                },
              },
            ]}
          />
          <DropdownButton
            disabled={disabled}
            className="m-0"
            icon={(p) => <PaperAirplaneIcon {...p} />}
            position="top"
            menu={[
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
                label: "Proforma...",
                onClick: () => {
                  openSendSpecialModal("proforma");
                },
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
                label: "Retourner en brouillon",
                onClick: () => _save({ state: "draft" }),
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
          <ButtonConfirm
            confirmTitle="Retourner en brouillon ?"
            confirmMessage="Votre client ne pourra plus voir cette version du devis."
            theme="outlined"
            disabled={disabled}
            icon={(p) => <XMarkIcon {...p} />}
            onClick={() => _save({ state: "draft" })}
          >
            Devis refusé
          </ButtonConfirm>
          <ButtonConfirm
            confirmTitle="Valider le devis ?"
            confirmMessage="Un devis marqué comme accepté doit être executé, vous ne pourrez plus revenir en brouillon. Vous pouvez attendre que le client accepte le devis si un email lui a été envoyé."
            disabled={disabled}
            icon={(p) => <CheckIcon {...p} />}
            onClick={() => _save({ state: "purchase_order" })}
          >
            Devis accepté
          </ButtonConfirm>
        </>
      )}

      {(draft.state === "purchase_order" ||
        draft.state === "completed" ||
        draft.state === "recurring") && (
        <>
          <DropdownButton
            theme="invisible"
            className="m-0"
            icon={(p) => <EllipsisHorizontalIcon {...p} />}
            menu={[
              ...commonOptions,
              {
                label: "Proforma...",
                onClick: () => {
                  openSendSpecialModal("proforma");
                },
              },
              {
                type: "divider",
              },
              {
                label: "Télécharger en PDF",
                onClick: () => getPdfPreview(draft),
              },
              {
                label: "Retourner en brouillon",
                onClick: () => {
                  _save({ state: "draft" });
                },
              },
              {
                label: "Clôturer le devis sans facturer",
                onClick: () => {
                  if (window.confirm("Clore définitivement le document?"))
                    _save({ state: "closed" });
                },
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
                    }),
                    { event }
                  ),
              },
            ]}
          />
          <Button
            disabled={disabled}
            icon={(p) => <DocumentCheckIcon {...p} />}
            onClick={() => openInvoiceModal(true)}
          >
            Facturer
          </Button>
        </>
      )}

      {draft.state === "recurring" && (
        <div>
          <Button
            theme="outlined"
            onClick={() => setRecurringModal(draft?.id)}
            icon={(p) => <ArrowPathIcon {...p} />}
          >
            Modifier l'abonnement
          </Button>
        </div>
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
                label: "Retourner en 'accepté'",
                onClick: () => _save({ state: "purchase_order" }),
              },
            ]}
          />
          <Button disabled={true}>Document fermé</Button>
        </>
      )}
    </>
  );
};
