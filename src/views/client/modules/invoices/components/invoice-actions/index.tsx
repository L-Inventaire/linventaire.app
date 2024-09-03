import { Button } from "@atoms/button/button";
import { ButtonConfirm } from "@atoms/button/confirm";
import { DropdownButton } from "@atoms/dropdown";
import { Info } from "@atoms/text";
import { withModel } from "@components/search-bar/utils/as-model";
import { useClients } from "@features/clients/state/use-clients";
import { useContact } from "@features/contacts/hooks/use-contacts";
import {
  getContactName,
  isContactLegalyDefined,
} from "@features/contacts/types/types";
import { Invoices } from "@features/invoices/types/types";
import { getRoute, ROUTES } from "@features/routes";
import { formatAddress } from "@features/utils/format/address";
import { useNavigateAlt } from "@features/utils/navigate";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import {
  CheckIcon,
  DocumentCheckIcon,
  EllipsisHorizontalIcon,
  PaperAirplaneIcon,
  PrinterIcon,
  TruckIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid";
import { useSetRecoilState } from "recoil";
import { getPdfPreview } from "../invoices-preview/invoices-preview";
import { InvoiceSendModal, InvoiceSendModalAtom } from "./modal-send";

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
    <div className="text-right space-x-2 flex items-center">
      <InvoiceSendModal id={id} />

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
                            from_rel_quote: draft.id,
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

          {draft.state === "purchase_order" && !isSupplierRelated && (
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
                    onClick: () => _save({ state: "closed" }),
                  },
                  {
                    label: "Créer une commande",
                    onClick: (event) =>
                      navigate(
                        withModel(
                          getRoute(ROUTES.InvoicesEdit, { id: "new" }),
                          {
                            ...draft,
                            from_rel_quote: draft.id,
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
    </div>
  );
};
