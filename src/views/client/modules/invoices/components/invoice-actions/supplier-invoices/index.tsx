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
  const format = _.get(client.invoices_counters, draft.type)?.format;
  const errorFormat = !format;

  const navigate = useNavigateAlt();

  return (
    <>
      {errorFormat && (
        <Button
          size="lg"
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
          size="lg"
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
      {draft.state === "closed" && !errorFormat && (
        <div>
          <Button disabled={true} size="lg">
            Document fermé
          </Button>
        </div>
      )}
      {draft.state === "completed" && !errorFormat && (
        <div>
          <Button disabled={true} size="lg">
            Facture payée et cloturée
          </Button>
        </div>
      )}
    </>
  );
};
