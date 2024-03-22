import { Info, Section, Title } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import { FormContext, useFormController } from "@components/form/formcontext";
import { useClients } from "@features/clients/state/use-clients";
import { ContactsApiClient } from "@features/contacts/api-client/contacts-api-client";
import { Contacts, getContactName } from "@features/contacts/types/types";
import { ROUTES, getRoute } from "@features/routes";
import { debounce } from "@features/utils/debounce";
import { Page, PageBlock, PageColumns } from "@views/client/_layout/page";
import { useEffect, useState } from "react";
import countries from "@assets/countries.json";
import _ from "lodash";

export const ContactsEditPage = () => {
  const { client } = useClients();
  const [contact, setContact] = useState<Contacts>({
    type: "company",
  } as Contacts);
  const ctrl = useFormController(contact, setContact);

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
      <FormContext alwaysVisible>
        <Title>Création de {getContactName(contact) || "-"}</Title>
        <div className="mt-4" />
        <PageColumns>
          <div className="grow lg:max-w-xl">
            <PageBlock>
              <Section>Général</Section>

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
                      <Info className="block mt-2 !mb-4">
                        Entrez un numéro de SIRET ou SIREN pour pré-remplir les
                        champs.
                      </Info>
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
              </div>
            </PageBlock>
            <PageBlock>
              <Section>Contacts</Section>
            </PageBlock>
            <PageBlock>
              <Section>Relations</Section>
            </PageBlock>
            <PageBlock>
              <Section>Statistiques</Section>
            </PageBlock>
          </div>
          <div className="grow">
            <PageBlock>
              <Section>Adresse de facturation</Section>
              <div className="space-y-2">
                <FormInput
                  label="Adresse ligne 1"
                  ctrl={ctrl(["address", "address_line_1"])}
                />
                <FormInput
                  label="Adresse ligne 2"
                  ctrl={ctrl(["address", "address_line_2"])}
                />
                <PageColumns>
                  <FormInput label="Ville" ctrl={ctrl(["address", "city"])} />
                  <FormInput
                    label="Code postal"
                    ctrl={ctrl(["address", "zip"])}
                  />
                </PageColumns>
                <PageColumns>
                  <FormInput
                    label="Région"
                    ctrl={ctrl(["address", "region"])}
                  />
                  <FormInput
                    type="select"
                    label="Pays"
                    ctrl={ctrl(["address", "country"])}
                    options={countries.map((a) => ({
                      label: a.name,
                      value: a.code,
                    }))}
                  />
                </PageColumns>
              </div>
            </PageBlock>
            <PageBlock>
              <Section>Adresse de livraison</Section>
            </PageBlock>
            <PageBlock>
              <Section>Coordonnées bancaires</Section>
            </PageBlock>
            <PageBlock>
              <Section>Préférences</Section>
            </PageBlock>
            <PageBlock>
              <Section>Notes</Section>
            </PageBlock>
          </div>
        </PageColumns>
      </FormContext>
    </Page>
  );
};
