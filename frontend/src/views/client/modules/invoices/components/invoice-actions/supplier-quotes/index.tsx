import { Button } from "@atoms/button/button";
import { DropdownButton } from "@atoms/dropdown";
import { withModel } from "@components/search-bar/utils/as-model";
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
import { getPdfPreview } from "../../invoices-preview/invoices-preview";
import _ from "lodash";

export const SupplierQuotesActions = ({
  id,
}: {
  id?: string;
  readonly?: boolean;
}) => {
  const navigate = useNavigateAlt();

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
              icon={(p) => <ChatBubbleBottomCenterIcon {...p} />}
              onClick={() => _save({ state: "sent" })}
            >
              Demande envoyée
            </Button>
          )}
          <Button
            disabled={disabled}
            className="m-0"
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
            className="m-0"
            icon={(p) => <EllipsisHorizontalIcon {...p} />}
            menu={[
              {
                label: "Télécharger en PDF",
                onClick: () => getPdfPreview(draft),
              },
              {
                label: "Clôturer la commande sans facture",
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
            icon={(p) => <DocumentCheckIcon {...p} />}
            onClick={(event: any) =>
              navigate(
                withModel(getRoute(ROUTES.InvoicesEdit, { id: "new" }), {
                  ..._.omit(
                    draft,
                    "id",
                    "emit_date",
                    "reference_preferred_value"
                  ),
                  type: "supplier_invoices",
                  state: "draft",
                  from_rel_quote: [draft.id],
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
            icon={(p) => <CubeIcon {...p} />}
            onClick={(event: any) =>
              navigate(
                getRoute(ROUTES.StockEditFrom, { from: "order", id: draft.id }),
                { event }
              )
            }
          >
            Réception
          </Button>
        </>
      )}
      {draft.state === "completed" && (
        <>
          <DropdownButton
            theme="invisible"
            className="m-0"
            icon={(p) => <EllipsisHorizontalIcon {...p} />}
            menu={[
              {
                label: "Re-ouvrir la réception",
                onClick: () => _save({ state: "purchase_order" }),
              },
            ]}
          />
          <Button
            disabled={disabled}
            theme="outlined"
            icon={(p) => <DocumentCheckIcon {...p} />}
            onClick={(event: any) =>
              navigate(
                withModel(getRoute(ROUTES.InvoicesEdit, { id: "new" }), {
                  ..._.omit(
                    draft,
                    "id",
                    "emit_date",
                    "reference_preferred_value"
                  ),
                  type: "supplier_invoices",
                  state: "draft",
                  from_rel_quote: [draft.id],
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
      {draft.state === "closed" && (
        <>
          <DropdownButton
            theme="invisible"
            className="m-0"
            icon={(p) => <EllipsisHorizontalIcon {...p} />}
            menu={[
              {
                label: "Re-ouvrir le document",
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
