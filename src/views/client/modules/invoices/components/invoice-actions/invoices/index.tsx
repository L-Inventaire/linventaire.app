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

export const InvoicesActions = ({
  id,
  readonly,
}: {
  id?: string;
  readonly?: boolean;
}) => {
  const navigate = useNavigateAlt();
  const openSendModal = useSetRecoilState(InvoiceSendModalAtom);

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

      {(draft.state === "sent" ||
        draft.state === "partial_paid" ||
        draft.state === "paid") && (
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
                label: "Créer une commande",
                onClick: (event) =>
                  navigate(
                    withModel(getRoute(ROUTES.InvoicesEdit, { id: "new" }), {
                      ...draft,
                      from_rel_quote: draft.id,
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
          >
            Enregistrer un paiement
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
        <div>
          <Button disabled={true} size="lg">
            Facture payée et cloturée
          </Button>
        </div>
      )}
    </>
  );
};
