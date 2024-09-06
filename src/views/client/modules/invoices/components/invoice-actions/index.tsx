import { Button } from "@atoms/button/button";
import { ButtonConfirm } from "@atoms/button/confirm";
import { DropdownButton } from "@atoms/dropdown";
import { Info } from "@atoms/text";
import { withModel } from "@components/search-bar/utils/as-model";
import { useClients } from "@features/clients/state/use-clients";
import { useContact } from "@features/contacts/hooks/use-contacts";
import { getContactName } from "@features/contacts/types/types";
import { Invoices } from "@features/invoices/types/types";
import { getRoute, ROUTES } from "@features/routes";
import { formatAddress } from "@features/utils/format/address";
import { useNavigateAlt } from "@features/utils/navigate";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import {
  ChatBubbleBottomCenterIcon,
  CheckIcon,
  EllipsisHorizontalIcon,
  PaperAirplaneIcon,
  PrinterIcon,
  TruckIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid";
import { useSetRecoilState } from "recoil";
import { getPdfPreview } from "../invoices-preview/invoices-preview";
import { InvoicesActions } from "./invoices";
import { InvoiceSendModal, InvoiceSendModalAtom } from "./modal-send";
import { QuotesActions } from "./quotes";
import { SupplierInvoicesActions } from "./supplier-invoices";
import { SupplierQuotesActions } from "./supplier-quotes";
import { InvoiceInvoiceModal } from "./modal-invoice";

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

  const openSendModal = useSetRecoilState(InvoiceSendModalAtom);

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

          {false && "to remove" && (
            <>
              {draft.state === "draft" && !isSupplierRelated && (
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

              {(draft.state === "draft" || draft.state === "sent") &&
                !!isSupplierRelated &&
                isSupplierQuote && (
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

              {draft.state === "sent" && draft.type === "quotes" && (
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
                            withModel(
                              getRoute(ROUTES.InvoicesEdit, { id: "new" }),
                              {
                                ...draft,
                                from_rel_quote: [draft.id],
                                type: "supplier_quotes",
                                state: "draft",
                                id: "",
                              }
                            ),
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

              {draft.state === "sent" &&
                draft.type !== "quotes" &&
                draft.type !== "supplier_quotes" && (
                  <>
                    <DropdownButton
                      className="m-0"
                      theme="invisible"
                      icon={(p) => <EllipsisHorizontalIcon {...p} />}
                      menu={[
                        ...(!isSupplierRelated
                          ? [
                              {
                                label: "Envoyer de nouveau...",
                                onClick: () => openSendModal(true),
                              },
                            ]
                          : []),
                        {
                          label: "Télécharger en PDF",
                          onClick: () => getPdfPreview(draft),
                        },
                      ]}
                    />
                    {isSupplierRelated && (
                      <Button
                        disabled={disabled}
                        size="lg"
                        theme="outlined"
                        icon={(p) => <TruckIcon {...p} />}
                        onClick={() => {
                          // TODO
                        }}
                      >
                        Réception
                      </Button>
                    )}
                    <Button
                      disabled={disabled}
                      size="lg"
                      icon={(p) => <CheckIcon {...p} />}
                      onClick={() => {
                        // TODO
                      }}
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
                    Document complet
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};
