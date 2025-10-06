import currencies from "@assets/currencies.json";
import languages from "@assets/languages.json";
import { InputLabel } from "@atoms/input/input-decoration-label";
import { MultiInput } from "@atoms/multi-input";
import { PageLoader } from "@atoms/page-loader";
import { Info } from "@atoms/text";
import { CustomFieldsInput } from "@components/custom-fields-input";
import { FormInput } from "@components/form/fields";
import { FormContext } from "@components/form/formcontext";
import { AddressInput } from "@components/input-button/address/form";
import { TagsInput } from "@components/input-rest/tags";
import { UsersInput } from "@components/input-rest/users";
import { useClients } from "@features/clients/state/use-clients";
import { ContactsApiClient } from "@features/contacts/api-client/contacts-api-client";
import { ContactsFieldsNames } from "@features/contacts/configuration";
import { Contacts } from "@features/contacts/types/types";
import { ROUTES } from "@features/routes";
import { paymentOptions } from "@features/utils/constants";
import { debounce } from "@features/utils/debounce";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { EditorInput } from "@molecules/editor-input";
import { Timeline } from "@molecules/timeline";
import { Heading } from "@radix-ui/themes";
import { PageColumns } from "@views/client/_layout/page";
import _ from "lodash";
import { useEffect } from "react";
import { InvoiceInputFormat } from "../../invoices/components/input-format";
import { InvoicePaymentInput } from "../../invoices/components/input-payment";
import { ContactAccountingAccount } from "./contact-accounting-account";
import { RelatedInvoicesInput } from "./related-invoices-input";
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
          setContact((prev: Partial<Contacts>) => {
            return {
              business_registered_name: value?.name,
              other_addresses: prev.other_addresses || {},
              ..._.omitBy(prev, (a) => _.isEmpty(a) && !_.isBoolean(a)),
              address: {
                address_line_1: value?.address?.address_line_1,
                address_line_2: value?.address?.address_line_2,
                city: value?.address?.city,
                region: value?.address?.region,
                zip: value?.address?.zip,
                country: value?.address?.country,
                ..._.omitBy(prev.address, _.isEmpty),
              },
            } as Partial<Contacts> as Contacts;
          });
        },
        {
          key: "sirene",
        }
      );
    }
  }, [contact.business_registered_id]);

  if (isPending || (id && contact.id !== id)) return <PageLoader />;

  return (
    <div className="grow @lg:w-full max-w-4xl mx-auto">
      <FormContext readonly={readonly} alwaysVisible>
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="space-x-2 flex items-center">
              <Heading className="grow">Contact</Heading>
              <div className="space-x-2">
                <TagsInput ctrl={ctrl("tags")} />
                <UsersInput ctrl={ctrl("assigned")} />
              </div>
            </div>

            <PageColumns>
              <FormInput
                className="w-max"
                label="Type de contact"
                type="select"
                options={[
                  {
                    label: "Aucun",
                    value: "none",
                  },
                  {
                    label: "Client",
                    value: "client",
                  },
                  {
                    label: "Fournisseur",
                    value: "supplier",
                  },
                  {
                    label: "Client et fournisseur",
                    value: "both",
                  },
                ]}
                value={
                  contact.is_supplier && contact.is_client
                    ? "both"
                    : contact.is_supplier
                    ? "supplier"
                    : contact.is_client
                    ? "client"
                    : "none"
                }
                onChange={(e) => {
                  ctrl("is_supplier").onChange(
                    e === "supplier" || e === "both"
                  );
                  ctrl("is_client").onChange(e === "client" || e === "both");
                }}
              />
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
            </PageColumns>

            <PageColumns>
              {contact.type === "person" && (
                <>
                  <FormInput label="Prénom" ctrl={ctrl("person_first_name")} />
                  <FormInput label="Nom" ctrl={ctrl("person_last_name")} />
                </>
              )}
              {contact.type === "company" && (
                <>
                  <FormInput
                    label="Raison sociale"
                    ctrl={ctrl("business_registered_name")}
                  />
                  <FormInput
                    label="Nom commercial"
                    ctrl={ctrl("business_name")}
                  />
                </>
              )}
            </PageColumns>

            {contact.type === "company" && (
              <PageColumns>
                <FormInput
                  label="SIRET / Numéro d'enregistrement"
                  ctrl={ctrl("business_registered_id")}
                />
                <FormInput
                  label="Numéro de TVA"
                  ctrl={ctrl("business_tax_id")}
                />
              </PageColumns>
            )}
          </div>

          <div className="space-y-4">
            <Heading size="4">Contact</Heading>

            <FormInput
              type="formatted"
              format="mail"
              label="Email"
              placeholder="email@server.com"
              ctrl={ctrl("email")}
            />
            <MultiInput
              render={(v, onChange) => (
                <FormInput
                  type="formatted"
                  format="mail"
                  label="Email supplémentaire"
                  placeholder="email@server.com"
                  value={v}
                  onChange={onChange}
                />
              )}
              value={contact.emails || []}
              onChange={(emails) => ctrl("emails").onChange(emails)}
              title="Ajouter un autre email"
            />

            <FormInput
              type="phone"
              label="Téléphone"
              placeholder="+33 6 12 34 56 78"
              ctrl={ctrl("phone")}
            />
            <MultiInput
              render={(v, onChange) => (
                <FormInput
                  type="phone"
                  label="Téléphone supplémentaire"
                  placeholder="+33 6 12 34 56 78"
                  value={v}
                  onChange={onChange}
                />
              )}
              value={contact.phones || []}
              onChange={(phones) => ctrl("phones").onChange(phones)}
              title="Ajouter un autre numéro de téléphone"
            />
          </div>

          {id && (contact.is_client || contact.is_supplier) && (
            <div className="space-y-4">
              <Heading size="4">Comptabilité</Heading>
              {contact.is_client && (
                <ContactAccountingAccount
                  type="client"
                  contactId={id}
                  readonly={readonly}
                />
              )}
              {contact.is_supplier && (
                <ContactAccountingAccount
                  type="supplier"
                  contactId={id}
                  readonly={readonly}
                />
              )}
            </div>
          )}

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

          <div className="space-y-4">
            <Heading size="4">Adresse principale</Heading>
            <AddressInput ctrl={ctrl("address")} autoComplete={false} />
          </div>

          {["delivery", "billing"].map((addressType) => {
            const type = addressType as "delivery" | "billing";
            const name = {
              delivery: "Adresse de livraison",
              billing: "Adresse de facturation",
            }[type];
            const ctrler = ("other_addresses." + type) as any;

            return (
              <div key={type} className="space-y-4">
                <Heading size="4">{name}</Heading>
                {!contact.other_addresses?.[type] && readonly && (
                  <Info>{name} égale à l'adresse principale.</Info>
                )}
                <FormInput
                  type="boolean"
                  placeholder="Utiliser l'adresse principale"
                  onChange={(e) =>
                    e
                      ? ctrl(ctrler).onChange(null)
                      : ctrl(ctrler).onChange({
                          ...contact.address,
                        })
                  }
                  value={!contact.other_addresses?.[type]}
                />
                {!!contact.other_addresses?.[type] && (
                  <AddressInput ctrl={ctrl(ctrler)} autoComplete={false} />
                )}
              </div>
            );
          })}

          <div className="space-y-4">
            <Heading size="4">Coordonnées bancaires</Heading>
            <FormInput
              label="IBAN"
              ctrl={ctrl("billing.iban")}
              type="formatted"
              format="iban"
            />
            <PageColumns>
              <FormInput label="BIC" ctrl={ctrl("billing.bic")} />
              <FormInput label="Titulaire" ctrl={ctrl("billing.name")} />
            </PageColumns>
            <FormInput
              label="Méthode de paiement par défaut"
              type="select"
              ctrl={ctrl("billing.payment_method")}
              options={[
                {
                  label: "Aucun",
                  value: "",
                },
                ...paymentOptions,
              ]}
            />
          </div>

          <div className="space-y-4">
            <Heading size="4">Préférences et format</Heading>

            <div className="flex space-x-4 flex-row">
              <div className="w-auto">
                <InvoiceInputFormat
                  btnKey="invoice-format"
                  ctrl={ctrl("invoices")}
                  readonly={readonly}
                />
              </div>
              <div className="w-auto">
                <InvoicePaymentInput
                  btnKey="invoice-payment"
                  ctrl={() => ({
                    onChange: (invoice) => {
                      ctrl("payment").onChange(invoice.payment_information);
                      ctrl("preferences").onChange({
                        ...ctrl("preferences").value,
                        currency: invoice.currency,
                      });
                    },
                    value: {
                      payment_information: ctrl("payment").value,
                      currency: ctrl("preferences").value?.currency,
                    },
                  })}
                  readonly={readonly}
                />
              </div>
            </div>

            <PageColumns>
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
            </PageColumns>
          </div>

          <div className="space-y-4">
            <Heading size="4">Notes et documents internes</Heading>
            <InputLabel
              label="Notes"
              input={
                <EditorInput
                  key={readonly ? ctrl("notes").value : undefined}
                  placeholder={
                    readonly ? "Aucune note" : "Cliquez pour ajouter des notes"
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

          <CustomFieldsInput
            table={"contacts"}
            ctrl={ctrl("fields")}
            readonly={readonly}
            entityId={contact.id || ""}
          />
        </div>

        {contact.id && (
          <div className="mt-6 space-y-4">
            <div className="overflow-auto">
              <RelatedInvoicesInput id={contact.id} readonly={readonly} />
            </div>
            <Timeline
              translations={ContactsFieldsNames() as any}
              entity={"contacts"}
              id={contact.id}
              viewRoute={ROUTES.ContactsView}
            />
          </div>
        )}
      </FormContext>
    </div>
  );
};
