import { Button } from "@atoms/button/button";
import { Info } from "@atoms/text";
import { useClients } from "@features/clients/state/use-clients";
import { useContact } from "@features/contacts/hooks/use-contacts";
import { getContactName } from "@features/contacts/types/types";
import { Invoices } from "@features/invoices/types/types";
import { getRoute, ROUTES } from "@features/routes";
import { formatAddress } from "@features/utils/format/address";
import { useNavigateAlt } from "@features/utils/navigate";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { InvoicesActions } from "./invoices";
import { InvoiceInvoiceModal } from "./modal-invoice";
import { InvoiceSendModal } from "./modal-send";
import { QuotesActions } from "./quotes";
import { SupplierInvoicesActions } from "./supplier-invoices";
import { SupplierQuotesActions } from "./supplier-quotes";
import { InvoiceSendSpecialModal } from "./modal-send-special";
import { getInvoiceWithOverrides } from "@features/invoices/utils";

export const InvoiceActions = ({
  id,
  readonly,
}: {
  id?: string;
  readonly?: boolean;
}) => {
  const { client: clientUser } = useClients();
  const client = clientUser!.client!;

  const navigate = useNavigateAlt();
  const { draft, save: _save } = useReadDraftRest<Invoices>(
    "invoices",
    id || "new"
  );

  const save = async () => {
    const item = await _save();
    if (item) navigate(getRoute(ROUTES.InvoicesView, { id: item?.id }));
  };

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

  const draftWithOverrides = getInvoiceWithOverrides(
    draft,
    ...[client, counterparty].filter((a) => a !== undefined && !!a)
  );

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
        !draftWithOverrides?.payment_information?.mode?.length ||
        (!draftWithOverrides?.payment_information?.bank_iban &&
          draftWithOverrides?.payment_information?.mode?.includes("bank"))
      ) {
        error =
          "Votre document nécessite un moyen de paiement valide, vous pouvez en définir un dans les paramètres.";
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
      !getContactName(counterparty)
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
    <div className="text-right space-x-2 flex items-center">
      <InvoiceSendModal id={id} />
      <InvoiceSendSpecialModal id={id} />
      <InvoiceInvoiceModal id={id} />

      <div className="grow"></div>

      {error && <Info className="text-red-500">{error}</Info>}

      {!readonly && (
        <>
          <Button size="lg" onClick={async () => await save()}>
            Sauvegarder
          </Button>
        </>
      )}

      {readonly && (
        <>
          {draft.type === "quotes" && (
            <QuotesActions id={id} readonly={disabled} />
          )}
          {draft.type !== "quotes" && !isSupplierRelated && (
            <InvoicesActions id={id} readonly={disabled} />
          )}

          {isSupplierQuote && (
            <SupplierQuotesActions id={id} readonly={disabled} />
          )}
          {!isSupplierQuote && isSupplierRelated && (
            <SupplierInvoicesActions id={id} readonly={disabled} />
          )}
        </>
      )}
    </div>
  );
};
