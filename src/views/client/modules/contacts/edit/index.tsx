import currencies from "@assets/currencies.json";
import languages from "@assets/languages.json";
import { Button } from "@atoms/button/button";
import { InputLabel } from "@atoms/input/input-decoration-label";
import { Info, Section, Title } from "@atoms/text";
import { AddressInput } from "@components/address-input";
import { EditorInput } from "@components/editor-input";
import { FormInput } from "@components/form/fields";
import { FormContext, useFormController } from "@components/form/formcontext";
import { useClients } from "@features/clients/state/use-clients";
import { ContactsApiClient } from "@features/contacts/api-client/contacts-api-client";
import { Contacts, getContactName } from "@features/contacts/types/types";
import { ROUTES, getRoute } from "@features/routes";
import { debounce } from "@features/utils/debounce";
import { useNavigationPrompt } from "@features/utils/use-navigation-prompt";
import { Page, PageBlock, PageColumns } from "@views/client/_layout/page";
import _ from "lodash";
import { useEffect, useState } from "react";

export const ContactsEditPage = () => {
  const { client } = useClients();
  const [contact, setContact] = useState<Contacts>({
    type: "company",
    delivery_address: null,
  } as Contacts);

  const { lockNavigation, ctrl } = useFormController(contact, setContact);
  useNavigationPrompt(lockNavigation);

  const readonly = false;

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

  return (
    <Page
      title={[
        { label: "Contacts", to: getRoute(ROUTES.Contacts) },
        { label: "Créer" },
      ]}
    >
      <FormContext readonly={readonly} alwaysVisible>
        <Button className="float-right" disabled={!getContactName(contact)}>
          Sauvegarder
        </Button>
        <Title>Création de {getContactName(contact) || "<nouveau>"}</Title>

        <div className="mt-4" />
        <PageColumns>
          <div className="grow lg:max-w-xl">
            <PageBlock closable title="Général">
              <div className="space-y-2">
                <FormContext size="lg">
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
                  </PageColumns>

                  {contact.type === "company" && (
                    <FormContext disabled={!contact.business_registered_id}>
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
                  <FormInput
                    label="Fournisseur"
                    placeholder="Ce contact est un fournisseur"
                    type="boolean"
                    ctrl={ctrl("is_supplier")}
                  />
                  <FormInput
                    label="Client"
                    placeholder="Ce contact est un client"
                    type="boolean"
                    ctrl={ctrl("is_client")}
                  />
                </PageColumns>
                <FormInput label="Étiquettes" type="tags" ctrl={ctrl("tags")} />
              </div>
            </PageBlock>
            <PageBlock closable title="Relations">
              <Section>Relations</Section>
            </PageBlock>
            <PageBlock closable title="Adresse de facturation">
              <AddressInput ctrl={ctrl("address")} autoComplete={false} />
            </PageBlock>
            <PageBlock closable title="Adresse de livraison">
              {contact.delivery_address === null && readonly && (
                <Info>Aucune adresse de livraison renseignée.</Info>
              )}
              <FormInput
                type="boolean"
                placeholder="Utiliser l'adresse de facturation"
                onChange={(e) =>
                  e
                    ? setContact({ ...contact, delivery_address: null })
                    : setContact({
                        ...contact,
                        delivery_address: { ...contact.address },
                      })
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
                  ctrl={ctrl(["billing", "iban"])}
                  type="formatted"
                  format="iban"
                />
                <PageColumns>
                  <FormInput label="BIC" ctrl={ctrl(["billing", "bic"])} />
                  <FormInput
                    label="Titulaire"
                    ctrl={ctrl(["billing", "name"])}
                  />
                </PageColumns>
                <br />
                <FormInput
                  label="Méthode de paiement par défaut"
                  type="select"
                  ctrl={ctrl(["billing", "payment_method"])}
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
          <div className="grow lg:max-w-xl">
            <PageBlock closable title="Contacts">
              <div className="space-y-2">
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
            <PageBlock closable title="Information complémentaire">
              TODO: custom fields
            </PageBlock>
            <PageBlock closable title="Notes et documents">
              <div className="space-y-2 mt-4">
                <InputLabel
                  label="Notes"
                  input={
                    <EditorInput placeholder="Cliquez pour ajouter des notes" />
                  }
                />
              </div>
            </PageBlock>
          </div>
        </PageColumns>
      </FormContext>
    </Page>
  );
};
