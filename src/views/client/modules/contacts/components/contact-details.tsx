import currencies from "@assets/currencies.json";
import languages from "@assets/languages.json";
import { InputLabel } from "@atoms/input/input-decoration-label";
import { PageLoader } from "@atoms/page-loader";
import { Info } from "@atoms/text";
import { CustomFieldsInput } from "@components/custom-fields-input";
import { FormInput } from "@components/form/fields";
import { FormContext } from "@components/form/formcontext";
import { AddressInput } from "@components/input-button/address/form";
import { useClients } from "@features/clients/state/use-clients";
import { ContactsApiClient } from "@features/contacts/api-client/contacts-api-client";
import { Contacts } from "@features/contacts/types/types";
import { debounce } from "@features/utils/debounce";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { EditorInput } from "@molecules/editor-input";
import {
  PageBlock,
  PageBlockHr,
  PageColumns,
} from "@views/client/_layout/page";
import _ from "lodash";
import { useEffect } from "react";
import { ContactAccountingAccount } from "./contact-accounting-account";
import { RelationsInput } from "./relations-input";

export const ContactsDetailsPage = ({
  readonly,
  id,
}: {
  readonly?: boolean;
  id: string;
}) => {
  const { client } = useClients();

  const {
    isPending,
    ctrl,
    draft: contact,
    setDraft: setContact,
  } = useReadDraftRest<Contacts>("contacts", id || "new", readonly);

  useEffect(() => {
    if (contact.business_registered_id && contact.type === "company") {
      debounce(
        async () => {
          const value = await ContactsApiClient.getSireneData(
            client?.client_id || "",
            contact.business_registered_id
          );
          setContact(
            (prev: Partial<Contacts>) =>
              ({
                business_registered_name: value?.name,
                delivery_address: prev.delivery_address,
                ..._.omitBy(prev, _.isEmpty),
                address: {
                  address_line_1: value?.address?.address_line_1,
                  address_line_2: value?.address?.address_line_2,
                  city: value?.address?.city,
                  region: value?.address?.region,
                  zip: value?.address?.zip,
                  country: value?.address?.country,
                  ..._.omitBy(prev.address, _.isEmpty),
                },
              } as Partial<Contacts> as Contacts)
          );
        },
        {
          key: "sirene",
        }
      );
    }
  }, [contact.business_registered_id]);

  if (isPending || (id && contact.id !== id)) return <PageLoader />;

  return (
    <>
      <FormContext readonly={readonly} alwaysVisible>
        <PageColumns>
          <div className="grow">
            <PageBlock closable title="Général">
              <div className="space-y-2">
                <FormContext size="md">
                  <PageColumns>
                    <FormInput
                      label="Type d'entité"
                      className="w-auto min-w-32 shrink-0"
                      type={"select"}
                      options={[
                        {
                          label: "Particulier",
                          value: "person",
                        },
                        {
                          label: "Entreprise",
                          value: "company",
                        },
                      ]}
                      ctrl={ctrl("type")}
                    />
                    {contact.type === "person" && (
                      <>
                        <FormInput
                          label="Prénom"
                          ctrl={ctrl("person_first_name")}
                        />
                        <FormInput
                          label="Nom"
                          ctrl={ctrl("person_last_name")}
                        />
                      </>
                    )}
                    {contact.type === "company" && (
                      <>
                        <FormInput
                          label="SIRET / Numéro d'enregistrement"
                          ctrl={ctrl("business_registered_id")}
                        />
                      </>
                    )}
                    <div className="grow w-full" />
                  </PageColumns>

                  {contact.type === "company" && (
                    <FormContext>
                      {!contact.business_registered_id && (
                        <Info className="block mt-2 !mb-4">
                          Entrez un numéro de SIRET ou SIREN pour pré-remplir
                          les champs.
                        </Info>
                      )}
                      <>
                        <PageColumns>
                          <FormInput
                            label="Raison sociale"
                            ctrl={ctrl("business_registered_name")}
                          />
                          <FormInput
                            label="Nom commercial"
                            ctrl={ctrl("business_name")}
                          />
                        </PageColumns>
                        <FormInput
                          label="Numéro de TVA"
                          ctrl={ctrl("business_tax_id")}
                        />
                      </>
                    </FormContext>
                  )}
                </FormContext>

                <PageColumns>
                  {contact.is_supplier}
                  <FormInput
                    label="Fournisseur"
                    placeholder="Ce contact est un fournisseur"
                    type="boolean"
                    value={!!contact.is_supplier}
                    onChange={(e) => ctrl("is_supplier").onChange(e)}
                  />
                  <FormInput
                    label="Client"
                    placeholder="Ce contact est un client"
                    type="boolean"
                    value={!!contact.is_client}
                    onChange={(e) => ctrl("is_client").onChange(e)}
                  />
                  <div className="grow w-full" />
                </PageColumns>

                <FormInput label="Étiquettes" type="tags" ctrl={ctrl("tags")} />

                <PageBlockHr />

                <FormInput
                  type="formatted"
                  format="mail"
                  label="Email"
                  placeholder="email@server.com"
                  ctrl={ctrl("email")}
                />
                <FormInput
                  type="phone"
                  label="Téléphone"
                  placeholder="+33 6 12 34 56 78"
                  ctrl={ctrl("phone")}
                />
              </div>
            </PageBlock>
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
                    table: "contacts",
                    id: contact.id || "",
                    column: "documents",
                  }}
                />
              </div>
            </PageBlock>
            <PageBlock closable title="Relations">
              <RelationsInput
                id={contact.id}
                readonly={readonly}
                value={[
                  ctrl("parents").value || [],
                  ctrl("parents_roles").value || [],
                ]}
                onChange={(parents, roles) => {
                  ctrl("parents").onChange(parents);
                  ctrl("parents_roles").onChange(roles);
                  ctrl("has_parents").onChange(!!parents.length);
                }}
              />
            </PageBlock>
            {readonly && (
              <PageBlock title="Commentaires">
                <Info>Bientôt disponible</Info>
              </PageBlock>
            )}
            {readonly && (
              <PageBlock title="Revisions">
                <Info>Bientôt disponible</Info>
              </PageBlock>
            )}
          </div>
          <div className="grow lg:max-w-xl">
            {id && (contact.is_client || contact.is_supplier) && (
              <PageBlock closable title="Comptabilité">
                {contact.is_client && (
                  <ContactAccountingAccount type="client" contactId={id} />
                )}
                {contact.is_supplier && (
                  <ContactAccountingAccount type="supplier" contactId={id} />
                )}
              </PageBlock>
            )}
            <PageBlock closable title="Adresse de facturation">
              <AddressInput ctrl={ctrl("address")} autoComplete={false} />
            </PageBlock>
            <PageBlock closable title="Adresse de livraison">
              {contact.delivery_address === null && readonly && (
                <Info>
                  Adresse de livraison égale à l'adresse de facturation.
                </Info>
              )}
              <FormInput
                type="boolean"
                placeholder="Utiliser l'adresse de facturation"
                onChange={(e) =>
                  e
                    ? ctrl("delivery_address").onChange(null)
                    : ctrl("delivery_address").onChange({ ...contact.address })
                }
                value={contact.delivery_address === null}
              />
              {contact.delivery_address !== null && (
                <div className="mt-4">
                  <AddressInput
                    ctrl={ctrl("delivery_address")}
                    autoComplete={false}
                  />
                </div>
              )}
            </PageBlock>
            <PageBlock
              closable
              title="Coordonnées bancaires"
              open={
                !!Object.values(contact.billing || {}).filter(Boolean).length
              }
            >
              <div className="space-y-2 mt-4">
                <FormInput
                  label="IBAN"
                  ctrl={ctrl("billing.iban")}
                  type="formatted"
                  format="iban"
                />
                <PageColumns>
                  <FormInput value="" label="BIC" ctrl={ctrl("billing.bic")} />
                  <FormInput
                    value=""
                    label="Titulaire"
                    ctrl={ctrl("billing.name")}
                  />
                </PageColumns>
                <br />
                <FormInput
                  label="Méthode de paiement par défaut"
                  type="select"
                  ctrl={ctrl("billing.payment_method")}
                  options={[
                    {
                      label: "Aucun",
                      value: "",
                    },
                    {
                      label: "Virement bancaire",
                      value: "bank",
                    },
                    {
                      label: "Espèces",
                      value: "cash",
                    },
                    {
                      label: "Chèque",
                      value: "check",
                    },
                    {
                      label: "SEPA",
                      value: "sepa",
                    },
                    {
                      label: "Paypal",
                      value: "paypal",
                    },
                    {
                      label: "Stripe",
                      value: "stripe",
                    },
                    {
                      label: "Autre",
                      value: "other",
                    },
                  ]}
                />
              </div>
            </PageBlock>
            <CustomFieldsInput
              table={"contacts"}
              ctrl={ctrl("fields")}
              readonly={readonly}
              entityId={contact.id || ""}
            />
            <PageBlock
              title="Préférences"
              closable
              open={
                !!contact.currency ||
                !!contact.language ||
                !!contact.tags?.length
              }
            >
              <div className="space-y-2 mt-4">
                <FormInput
                  label="Langue de préférence"
                  placeholder="Sélectionner une langue"
                  type="select"
                  ctrl={ctrl("language")}
                  options={[
                    {
                      label: "Aucune",
                      value: "",
                    },
                    ...languages,
                  ]}
                />
                <FormInput
                  label="Devise de préférence"
                  placeholder="Sélectionner une devise"
                  type="select"
                  ctrl={ctrl("currency")}
                  options={[
                    {
                      label: "Aucune",
                      value: "",
                    },
                    ...currencies,
                  ]}
                />
              </div>
            </PageBlock>
          </div>
        </PageColumns>
      </FormContext>
    </>
  );
};
