import { Button } from "@atoms/button/button";
import { Info } from "@atoms/text";
import { useClients } from "@features/clients/state/use-clients";
import { useContact } from "@features/contacts/hooks/use-contacts";
import {
  getContactName,
  isContactLegalyDefined,
} from "@features/contacts/types/types";
import { Invoices } from "@features/invoices/types/types";
import { formatAddress } from "@features/utils/format/address";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import {
  CheckIcon,
  DocumentCheckIcon,
  EllipsisHorizontalIcon,
  PaperAirplaneIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid";

export const InvoiceFooter = ({
  id,
  readonly,
}: {
  id?: string;
  readonly?: boolean;
}) => {
  const { client: clientUser } = useClients();
  const client = clientUser!.client!;

  const { draft, save } = useReadDraftRest<Invoices>("invoices", id || "new");

  const isSupplierInvoice =
    draft.type === "supplier_credit_notes" ||
    draft.type === "supplier_invoices";
  const isSupplierQuote = draft.type === "supplier_quotes";
  const isSupplierRelated = isSupplierInvoice || isSupplierQuote;

  const { contact: counterparty } = useContact(
    !isSupplierRelated ? draft.client : draft.supplier
  );

  const namedCounterparty = !!getContactName(counterparty || {});
  const billableContent = draft?.content?.filter(
    (c) => c.unit_price && c.quantity
  )?.length;

  let disabled = false;
  if (!counterparty || !billableContent) {
    disabled = true;
  }

  /* Warnings:
    - Missing payment information
    - Date in the future or in the past more than 1 month
    - Missing recipient name
    Missing sender address
    Missing sender name
    Missing sender identification / status
    */
  let error = "";
  if (counterparty) {
    if (["quotes", "invoices"].includes(draft.type)) {
      if (
        !draft?.payment_information?.mode?.length ||
        (!draft?.payment_information?.bank_iban &&
          draft?.payment_information?.mode?.includes("bank"))
      ) {
        error = "Votre document nécessite un moyen de paiement valide.";
      }
    }

    if ((!draft.client || !namedCounterparty) && !isSupplierRelated) {
      error = "Les données du client sont incomplètes";
    }
    if ((!draft.supplier || !namedCounterparty) && isSupplierRelated) {
      error = "Les données du fournisseur sont incomplètes";
    }

    if (!formatAddress(client?.address)?.length) {
      error = "Vous devez définir une adresse dans vos paramètres";
    }

    if (!client?.company?.registration_number) {
      error =
        "Vous devez définir un numéro d'immatriculation dans vos paramètres";
    }

    if (
      [
        "supplier_quotes",
        "supplier_invoices",
        "supplier_credit_notes",
      ].includes(draft.type) &&
      !isContactLegalyDefined(client)
    ) {
      error = "Les données du fournisseur sont incomplètes";
    }

    if (
      draft.state === "draft" &&
      (new Date(draft.emit_date).getTime() >
        Date.now() + 24 * 60 * 606 * 1000 ||
        new Date(draft.emit_date).getTime() <
          Date.now() - 31 * 24 * 60 * 606 * 1000)
    ) {
      error = "La date d'émission du document est invalide.";
    }
  }

  disabled = disabled || !!error;

  return (
    <div className="text-right space-x-2">
      {error && <Info className="text-red-500">{error}</Info>}

      {!readonly && (
        <>
          <Button size="lg" onClick={async () => await save()}>
            Sauvegarder
          </Button>
        </>
      )}

      {readonly && draft.state === "draft" && !isSupplierRelated && (
        <>
          <Button
            disabled={disabled}
            size="lg"
            icon={(p) => <PaperAirplaneIcon {...p} />}
          >
            Envoyer
          </Button>
        </>
      )}

      {readonly && draft.state === "sent" && draft.type === "quotes" && (
        <>
          <Button
            theme="invisible"
            icon={(p) => <EllipsisHorizontalIcon {...p} />}
          />
          {/* Créer une commande ou retour en brouillon */}
          <Button
            theme="outlined"
            disabled={disabled}
            size="lg"
            icon={(p) => <XMarkIcon {...p} />}
          >
            Devis refusé
          </Button>
          <Button
            disabled={disabled}
            size="lg"
            icon={(p) => <CheckIcon {...p} />}
          >
            Devis accepté
          </Button>
        </>
      )}

      {readonly && draft.state === "purchase_order" && !isSupplierRelated && (
        <>
          <Button
            theme="invisible"
            icon={(p) => <EllipsisHorizontalIcon {...p} />}
          />
          {/* Créer une commande, marquer comme annulé */}
          <Button
            disabled={disabled}
            size="lg"
            icon={(p) => <DocumentCheckIcon {...p} />}
          >
            Facturer
          </Button>
        </>
      )}
    </div>
  );
};
