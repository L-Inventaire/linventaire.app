import { Button } from "@atoms/button/button";
import { ButtonConfirm } from "@atoms/button/confirm";
import { DropdownButton } from "@atoms/dropdown";
import { withModel } from "@components/search-bar/utils/as-model";
import { Invoices } from "@features/invoices/types/types";
import { getRoute, ROUTES } from "@features/routes";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import {
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

  const { draft, save: _save } = useReadDraftRest<Invoices>(
    "invoices",
    id || "new"
  );
  const disabled =
    readonly || draft.state === "closed" || draft.state === "completed";

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
                onClick: () => {
                  if (
                    // TODO: make a better modal
                    window.confirm(
                      "Marquer comme envoyé ? Le retour en brouillon ne sera plus possible."
                    )
                  )
                    _save({ state: "sent" });
                },
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
                      ...draft,
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
            size="lg"
            icon={(p) => <XMarkIcon {...p} />}
            onClick={() => _save({ state: "draft" })}
          >
            Devis refusé
          </ButtonConfirm>
          <ButtonConfirm
            confirmTitle="Valider le devis ?"
            confirmMessage="Un devis marqué comme accepté doit être executé, vous ne pourrez plus revenir en brouillon. Vous pouvez attendre que le client accepte le devis si un email lui a été envoyé."
            disabled={disabled}
            size="lg"
            icon={(p) => <CheckIcon {...p} />}
            onClick={() => _save({ state: "purchase_order" })}
          >
            Devis accepté
          </ButtonConfirm>
        </>
      )}

      {draft.state === "purchase_order" && (
        <>
          <DropdownButton
            theme="invisible"
            size="lg"
            className="m-0"
            icon={(p) => <EllipsisHorizontalIcon {...p} />}
            menu={[
              {
                label: "Télécharger en PDF",
                onClick: () => getPdfPreview(draft),
              },
              {
                label: "Marquer comme annulé",
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
                      ...draft,
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
            icon={(p) => <DocumentCheckIcon {...p} />}
            onClick={() => openInvoiceModal(true)}
          >
            Facturer
          </Button>
        </>
      )}

      {draft.state === "closed" && (
        <div>
          <Button disabled={true} size="lg">
            Document fermé
          </Button>
        </div>
      )}

      {draft.state === "completed" && (
        <>
          <DropdownButton
            theme="invisible"
            size="lg"
            className="m-0"
            icon={(p) => <EllipsisHorizontalIcon {...p} />}
            menu={[
              {
                label: "Créer une facture",
                onClick: () => openInvoiceModal(true),
              },
            ]}
          />
          <Button disabled={true} size="lg">
            Document complet
          </Button>
        </>
      )}
    </>
  );
};
