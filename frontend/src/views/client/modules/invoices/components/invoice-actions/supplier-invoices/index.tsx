import { Button } from "@atoms/button/button";
import { DropdownButton } from "@atoms/dropdown";
import { Invoices } from "@features/invoices/types/types";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { CheckIcon, EllipsisHorizontalIcon } from "@heroicons/react/16/solid";
import { getPdfPreview } from "../../invoices-preview/invoices-preview";
import { useEditFromCtrlK } from "@features/ctrlk/use-edit-from-ctrlk";
import { AccountingTransactions } from "@features/accounting/types/types";
import _ from "lodash";
import { useClients } from "@features/clients/state/use-clients";
import { useNavigateAlt } from "@features/utils/navigate";
import { getRoute, ROUTES } from "@features/routes";

export const SupplierInvoicesActions = ({
  id,
  readonly,
}: {
  id?: string;
  readonly?: boolean;
}) => {
  const { draft, save: _save } = useReadDraftRest<Invoices>(
    "invoices",
    id || "new"
  );
  const disabled =
    readonly || draft.state === "closed" || draft.state === "completed";
  const edit = useEditFromCtrlK();

  const { client: clientUser } = useClients();
  const client = clientUser!.client!;
  const format = _.get(client.invoices_counters, [
    new Date(draft.emit_date || Date.now()).getFullYear().toString(),
    draft.type,
  ])?.format;
  const errorFormat = !format;

  const navigate = useNavigateAlt();

  return (
    <>
      {errorFormat && (
        <Button
          icon={(p) => <CheckIcon {...p} />}
          onClick={() => {
            navigate(getRoute(ROUTES.SettingsPreferences));
          }}
        >
          Définir le format de numérotation
        </Button>
      )}

      {draft.state === "draft" && !errorFormat && (
        <Button
          disabled={disabled}
          icon={(p) => <CheckIcon {...p} />}
          onClick={() => {
            _save({ state: "sent" });
          }}
        >
          Comptabiliser
        </Button>
      )}

      {draft.state === "sent" && !errorFormat && (
        <>
          <DropdownButton
            className="m-0"
            theme="invisible"
            icon={(p) => <EllipsisHorizontalIcon {...p} />}
            menu={[
              {
                label: "Télécharger en PDF",
                onClick: () => getPdfPreview(draft),
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
      {draft.state === "closed" && !errorFormat && (
        <>
          <DropdownButton
            theme="invisible"
            className="m-0"
            icon={(p) => <EllipsisHorizontalIcon {...p} />}
            menu={[
              {
                label: "Re-ouvrir le document",
                onClick: () => _save({ state: "sent" }),
              },
            ]}
          />
          <Button disabled={true}>Document fermé</Button>
        </>
      )}
      {draft.state === "completed" && !errorFormat && (
        <>
          <DropdownButton
            theme="invisible"
            className="m-0"
            icon={(p) => <EllipsisHorizontalIcon {...p} />}
            menu={[
              {
                label: "Re-ouvrir le document",
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
