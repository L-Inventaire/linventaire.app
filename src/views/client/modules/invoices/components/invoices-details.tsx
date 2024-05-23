import { InputLabel } from "@atoms/input/input-decoration-label";
import { SectionSmall } from "@atoms/text";
import { AddressInput } from "@components/address-input";
import { CustomFieldsInput } from "@components/custom-fields-input";
import { EditorInput } from "@components/editor-input";
import { FormInput } from "@components/form/fields";
import { FormContext } from "@components/form/formcontext";
import { InvoiceFormatInput } from "@components/invoice-format-input";
import { PageLoader } from "@components/page-loader";
import { PaymentInput } from "@components/payment-input";
import { useClients } from "@features/clients/state/use-clients";
import { useContact } from "@features/contacts/hooks/use-contacts";
import { Invoices } from "@features/invoices/types/types";
import { currencyOptions, languageOptions } from "@features/utils/constants";
import { formatAmount } from "@features/utils/format/strings";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import {
  PageBlock,
  PageBlockHr,
  PageColumns,
} from "@views/client/_layout/page";
import { useEffect } from "react";

export const InvoicesDetailsPage = ({
  readonly,
  id,
}: {
  readonly?: boolean;
  id: string;
}) => {
  const { client: clientUser } = useClients();
  const client = clientUser?.client;

  const { isPending, ctrl, draft, setDraft } = useReadDraftRest<Invoices>(
    "invoices",
    id || "new",
    readonly
  );

  const { contact } = useContact(draft.contact);

  useEffect(() => {
    if (client && !id) {
      setDraft({
        ...draft,
        currency: client.preferences?.currency || "EUR",
        format: client.invoices,
        payment_information: client.payment,
      });
    }
  }, [client]);

  if (isPending || (id && draft.id !== id) || !client) return <PageLoader />;

  return (
    <>
      <FormContext readonly={readonly} alwaysVisible>
        <PageColumns>
          <div className="grow">
            <PageBlock title="Devis">
              <div className="space-y-2">
                <div className="mb-4">
                  <PageColumns>
                    <FormInput
                      ctrl={ctrl("reference")}
                      label="Référence"
                      className="w-1/3"
                      size="lg"
                    />
                    <FormInput
                      ctrl={ctrl("name")}
                      label="Titre"
                      placeholder="Titre interne"
                      size="lg"
                    />
                  </PageColumns>
                </div>
                <PageColumns>
                  <FormInput
                    ctrl={ctrl("tags")}
                    label="Étiquettes"
                    type="tags"
                  />
                  <FormInput
                    ctrl={ctrl("assigned")}
                    label="Assigné à"
                    type="users"
                  />
                </PageColumns>

                <PageBlockHr />

                <PageColumns>
                  <FormInput
                    type="rest_documents"
                    rest={{ table: "invoices", column: "client" }}
                    label="Client"
                    ctrl={ctrl("client")}
                    max={1}
                  />
                  <FormInput
                    type="rest_documents"
                    rest={{ table: "invoices", column: "contact" }}
                    label="Contact (optionnel)"
                    ctrl={ctrl("contact")}
                    max={1}
                  />
                </PageColumns>
              </div>
            </PageBlock>
            <PageBlock title="Prestation">
              Lignes
              <PageBlockHr />
              <div className="space-y-2">
                {!readonly && (
                  <FormInput
                    className="-mt-1"
                    type="boolean"
                    placeholder="Appliquer une remise globale"
                    value={!!draft.discount?.mode}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        discount: {
                          value: 0,
                          ...(draft.discount || {}),
                          mode: e ? "amount" : null,
                        },
                      })
                    }
                  />
                )}
                {!!draft.discount?.mode && (
                  <PageColumns>
                    <FormInput
                      className="w-max"
                      ctrl={ctrl("discount.mode")}
                      label="Type de remise"
                      type="select"
                      options={[
                        { label: "Montant", value: "amount" },
                        { label: "Pourcentage", value: "percentage" },
                      ]}
                    />
                    <FormInput
                      className="w-max"
                      ctrl={ctrl("discount.value")}
                      label="Valeur"
                      type="formatted"
                      format={
                        draft.discount?.mode === "amount"
                          ? "price"
                          : "percentage"
                      }
                    />
                    <div className="grow" />
                  </PageColumns>
                )}
              </div>
            </PageBlock>

            <div className="flex">
              <div className="grow" />
              <PageBlock>
                <div className="space-y-2 min-w-64 block">
                  <div className="whitespace-nowrap flex flex-row items-center justify-between w-full space-x-4">
                    <span>Total HT</span>
                    {formatAmount(draft.total?.initial || 0)}
                  </div>
                  {!!(draft.total?.discount || 0) && (
                    <>
                      <div className="whitespace-nowrap flex flex-row items-center justify-between w-full space-x-4">
                        <span>Remise</span>
                        <span>{formatAmount(draft.total?.discount || 0)}</span>
                      </div>
                      <div className="whitespace-nowrap flex flex-row items-center justify-between w-full space-x-4">
                        <span>Total HT après remise</span>
                        <span>{formatAmount(draft.total?.total || 0)}</span>
                      </div>
                    </>
                  )}
                  <div className="whitespace-nowrap flex flex-row items-center justify-between w-full space-x-4">
                    <span>TVA</span>
                    {formatAmount(draft.total?.taxes || 0)}
                  </div>
                  <div className="whitespace-nowrap flex flex-row items-center justify-between w-full space-x-4">
                    <SectionSmall className="inline">Total TTC</SectionSmall>
                    <SectionSmall className="inline">
                      {formatAmount(draft.total?.total_with_taxes || 0)}
                    </SectionSmall>
                  </div>
                </div>
              </PageBlock>
            </div>

            <PageBlock closable title="Informations additionelles">
              <div className="space-y-2">
                <FormInput
                  type="date"
                  label="Date d'émission de la facture"
                  ctrl={ctrl("emit_date")}
                />

                <PageBlockHr />

                <FormInput
                  type="files"
                  label="Documents partagés avec le client"
                  ctrl={ctrl("attachments")}
                />

                <PageBlockHr />

                {!ctrl("delivery_date").value && !readonly && (
                  <FormInput
                    placeholder="Ajouter une date de livraison"
                    type="boolean"
                    value={ctrl("delivery_date").value}
                    onChange={(e) =>
                      ctrl("delivery_date").onChange(
                        e ? Date.now() + 1000 * 60 * 60 * 24 * 7 : 0
                      )
                    }
                  />
                )}
                {!!ctrl("delivery_date").value && (
                  <FormInput
                    type="date"
                    label="Date de livraison"
                    ctrl={ctrl("delivery_date")}
                  />
                )}

                {!readonly && (
                  <FormInput
                    placeholder="Ajouter une adresse de livraison"
                    type="boolean"
                    value={ctrl("delivery_address").value}
                    onChange={(e) =>
                      ctrl("delivery_address").onChange(
                        e
                          ? ({
                              address_line_1:
                                contact?.address.address_line_1 || "",
                              address_line_2:
                                contact?.address.address_line_2 || "",
                              region: contact?.address.region || "",
                              country: contact?.address.country || "",
                              zip: contact?.address.zip || "",
                              city: contact?.address.city || "",
                            } as Invoices["delivery_address"])
                          : null
                      )
                    }
                  />
                )}
                {ctrl("delivery_address").value !== null && (
                  <>
                    <AddressInput ctrl={ctrl("delivery_address")} />
                  </>
                )}
              </div>
            </PageBlock>
            <PageBlock closable title="Paiement">
              <FormInput
                label="Devise"
                className="w-max mb-4"
                ctrl={ctrl("currency")}
                type="select"
                options={currencyOptions}
              />
              <PaymentInput
                readonly={readonly}
                ctrl={ctrl("payment_information")}
              />
            </PageBlock>
            <PageBlock closable title="Format">
              <FormInput
                label="Langue"
                className="w-max mb-4"
                ctrl={ctrl("language")}
                type="select"
                options={languageOptions}
              />
              <PageBlockHr />
              <InvoiceFormatInput readonly={readonly} ctrl={ctrl("format")} />
            </PageBlock>
            {draft.type === "invoice" && (
              <PageBlock closable title="Rappels">
                Rappels (TODO)
              </PageBlock>
            )}
            {draft.type === "invoice" && (
              <PageBlock closable title="Récurrence">
                Récurrence (TODO)
              </PageBlock>
            )}
            <PageBlock closable title="Notes et documents">
              <div className="space-y-2 mt-4">
                <InputLabel
                  label="Notes"
                  input={
                    <EditorInput
                      key={readonly ? ctrl("notes").value : undefined}
                      placeholder={
                        readonly
                          ? "Aucune note"
                          : "Cliquez pour ajouter des notes"
                      }
                      disabled={readonly}
                      value={ctrl("notes").value || ""}
                      onChange={(e) => ctrl("notes").onChange(e)}
                    />
                  }
                />
                <FormInput
                  type="files"
                  label="Documents"
                  ctrl={ctrl("documents")}
                  rest={{
                    table: "invoices",
                    id: draft.id || "",
                    column: "documents",
                  }}
                />
              </div>
            </PageBlock>
            <PageBlock closable title="Champs additionels">
              <CustomFieldsInput
                table={"invoices"}
                ctrl={ctrl("fields")}
                readonly={readonly}
                entityId={draft.id || ""}
              />
            </PageBlock>
          </div>
          <div className="grow">
            <PageBlock title="Status">
              state
              <br />
              related items
            </PageBlock>
            <div className="p-8">
              <div className="w-full bg-white shadow-md h-80"></div>
            </div>
          </div>
        </PageColumns>
      </FormContext>
    </>
  );
};
