import { Button } from "@atoms/button/button";
import { DropdownButton } from "@atoms/dropdown";
import { Invoices } from "@features/invoices/types/types";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { CheckIcon, EllipsisHorizontalIcon } from "@heroicons/react/16/solid";
import { getPdfPreview } from "../../invoices-preview/invoices-preview";

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

  return (
    <>
      {draft.state === "sent" && (
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
