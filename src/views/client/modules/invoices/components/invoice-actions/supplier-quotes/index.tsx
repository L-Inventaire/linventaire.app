import { Button } from "@atoms/button/button";
import { DropdownButton } from "@atoms/dropdown";
import { withModel } from "@components/search-bar/utils/as-model";
import { useEditFromCtrlK } from "@features/ctrlk/use-edit-from-ctrlk";
import { Invoices } from "@features/invoices/types/types";
import { getRoute, ROUTES } from "@features/routes";
import { useNavigateAlt } from "@features/utils/navigate";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import {
  ChatBubbleBottomCenterIcon,
  CheckIcon,
  CubeIcon,
  DocumentCheckIcon,
  EllipsisHorizontalIcon,
  PrinterIcon,
} from "@heroicons/react/16/solid";
import { useSetRecoilState } from "recoil";
import { getPdfPreview } from "../../invoices-preview/invoices-preview";
import { InvoiceInvoiceModalAtom } from "../modal-invoice";

export const SupplierQuotesActions = ({
  id,
}: {
  id?: string;
  readonly?: boolean;
}) => {
  const edit = useEditFromCtrlK();
  const navigate = useNavigateAlt();
  const openInvoiceModal = useSetRecoilState(InvoiceInvoiceModalAtom);

  const { draft, save: _save } = useReadDraftRest<Invoices>(
    "invoices",
    id || "new"
  );
  const disabled = draft.state === "closed";

  return (
    <>
      {(draft.state === "draft" || draft.state === "sent") && (
        <>
          <DropdownButton
            disabled={disabled}
            className="m-0"
            theme="invisible"
            icon={(p) => <EllipsisHorizontalIcon {...p} />}
            position="top"
            menu={[
              {
                label: "Télécharger le PDF",
                icon: (p) => <PrinterIcon {...p} />,
                onClick: () => getPdfPreview(draft),
              },
              {
                label: "Marquer comme demandé",
                icon: (p) => <ChatBubbleBottomCenterIcon {...p} />,
                onClick: () => {
                  _save({ state: "sent" });
                },
              },
              {
                label: "Marquer comme commande acceptée",
                icon: (p) => <CheckIcon {...p} />,
                onClick: () => {
                  _save({ state: "purchase_order" });
                },
              },
            ]}
          />
          {draft.state === "draft" && (
            <Button
              disabled={disabled}
              theme="outlined"
              className="m-0"
              size="lg"
              icon={(p) => <ChatBubbleBottomCenterIcon {...p} />}
              onClick={() => _save({ state: "sent" })}
            >
              Demande envoyée
            </Button>
          )}
          <Button
            disabled={disabled}
            className="m-0"
            size="lg"
            icon={(p) => <CheckIcon {...p} />}
            onClick={() => _save({ state: "purchase_order" })}
          >
            Commandé
          </Button>
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
            ]}
          />

          <Button
            disabled={disabled}
            theme="outlined"
            size="lg"
            icon={(p) => <DocumentCheckIcon {...p} />}
            onClick={(event: any) =>
              navigate(
                withModel(getRoute(ROUTES.InvoicesEdit, { id: "new" }), {
                  ...draft,
                  type: "supplier_invoices",
                  state: "draft",
                  id: "",
                }),
                { event }
              )
            }
          >
            Enregistrer une facture
          </Button>

          <Button
            disabled={disabled}
            size="lg"
            icon={(p) => <CubeIcon {...p} />}
            onClick={() =>
              edit("stock_items", undefined, { from_rel_quote: [draft.id] })
            }
          >
            Réception
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
          <Button
            disabled={disabled}
            theme="outlined"
            size="lg"
            icon={(p) => <DocumentCheckIcon {...p} />}
            onClick={(event: any) =>
              navigate(
                withModel(getRoute(ROUTES.InvoicesEdit, { id: "new" }), {
                  ...draft,
                  type: "supplier_invoices",
                  state: "draft",
                  id: "",
                }),
                { event }
              )
            }
          >
            Enregistrer une facture
          </Button>
        </>
      )}
    </>
  );
};
