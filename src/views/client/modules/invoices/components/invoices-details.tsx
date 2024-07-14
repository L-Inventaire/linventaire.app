import { Tag } from "@atoms/badge/tag";
import { Button } from "@atoms/button/button";
import { InputLabel } from "@atoms/input/input-decoration-label";
import { PageLoader } from "@atoms/page-loader";
import { Info, Section, SectionSmall } from "@atoms/text";
import { CustomFieldsInput } from "@components/custom-fields-input";
import { FormInput } from "@components/form/fields";
import { FormContext } from "@components/form/formcontext";
import { InputButton } from "@components/input-button";
import { AddressInput } from "@components/input-button/address/form";
import { RestDocumentsInput } from "@components/input-rest";
import { FilesInput } from "@components/input-rest/files";
import { TagsInput } from "@components/input-rest/tags";
import { UsersInput } from "@components/input-rest/users";
import { InvoiceFormatInput } from "@components/invoice-format-input";
import { PaymentInput } from "@components/payment-input";
import { Articles } from "@features/articles/types/types";
import { useClients } from "@features/clients/state/use-clients";
import { useContact } from "@features/contacts/hooks/use-contacts";
import { Contacts } from "@features/contacts/types/types";
import { Invoices } from "@features/invoices/types/types";
import { getDocumentName } from "@features/invoices/utils";
import {
  currencyOptions,
  languageOptions,
  tvaOptions,
  unitOptions,
} from "@features/utils/constants";
import { formatTime } from "@features/utils/format/dates";
import { getFormattedNumerotation } from "@features/utils/format/numerotation";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import {
  BuildingStorefrontIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  UserIcon,
} from "@heroicons/react/20/solid";
import { EditorInput } from "@molecules/editor-input";
import {
  PageBlock,
  PageBlockHr,
  PageColumns,
  PageHr,
} from "@views/client/_layout/page";
import _ from "lodash";
import { useEffect } from "react";
import { twMerge } from "tailwind-merge";
import { computePricesFromInvoice } from "../utils";
import { InvoiceLinesInput } from "./invoice-lines-input";
import { InvoicesPreview } from "./invoices-preview/invoices-preview";

export const computeCompletion = (linesu: Invoices["content"]) => {
  const lines = linesu || [];
  const total = lines.reduce(
    (acc, line) => acc + parseFloat((line.quantity as any) || 0),
    0
  );
  if (total === 0) return 1;

  return (
    lines.reduce(
      (acc, line) =>
        acc +
        Math.min(
          parseFloat((line.quantity as any) || 0),
          parseFloat((line.quantity_ready as any) || 0)
        ),
      0
    ) / total
  );
};

export const renderCompletion = (
  lines: Invoices["content"]
): [number, string] => {
  const value = computeCompletion(lines);
  const color = value < 0.5 ? "red" : value < 0.8 ? "orange" : "green";
  return [Math.round(value * 100), color];
};

export const InvoicesDetailsPage = ({
  readonly,
  id,
}: {
  readonly?: boolean;
  id: string;
}) => {
  const { client: clientUser } = useClients();
  const client = clientUser!.client!;

  const { isPending, ctrl, draft, setDraft } = useReadDraftRest<Invoices>(
    "invoices",
    id || "new",
    readonly
  );

  const { contact } = useContact(draft.contact);

  useEffect(() => {
    if (!isPending && draft)
      setDraft((draft: Invoices) => {
        draft = _.cloneDeep(draft);
        if (!draft.emit_date) draft.emit_date = new Date();
        if (draft.type) {
          draft.reference = getFormattedNumerotation(
            client.invoices_counters[draft.type]?.format,
            client.invoices_counters[draft.type]?.counter,
            draft.state === "draft"
          );
        }
        draft.total = computePricesFromInvoice(draft);
        draft.content = (draft.content || []).map((a) => ({
          ...a,
          _id: a._id || _.uniqueId(),
        }));
        return draft;
      });
  }, [JSON.stringify(draft)]);

  if (isPending || (id && draft.id !== id) || !client) return <PageLoader />;

  const isSupplierInvoice =
    draft.type === "supplier_credit_notes" ||
    draft.type === "supplier_invoices";
  const isSupplierQuote = draft.type === "supplier_quotes";
  const isSupplierRelated = isSupplierInvoice || isSupplierQuote;
  const hasClientOrSupplier =
    (draft.client && !isSupplierRelated) ||
    (draft.supplier && isSupplierRelated);

  const hasPreview =
    hasClientOrSupplier && !isSupplierInvoice && !isSupplierQuote;

  return (
    <>
      <FormContext readonly={readonly} alwaysVisible>
        <PageColumns>
          <div className="grow" />
          <div className="grow lg:w-3/5 max-w-3xl pt-6">
            <Section>
              {getDocumentName(draft.type) +
                " " +
                ctrl("reference").value +
                (ctrl("name").value ? ` (${ctrl("name").value})` : "")}
              <Tag
                noColor
                color={renderCompletion(draft.content)[1]}
                size="sm"
                className="ml-2"
              >
                {renderCompletion(draft.content)[0]}% complet
              </Tag>
            </Section>
            <div className="space-y-2 mb-6">
              <PageColumns>
                {!isSupplierInvoice && !isSupplierQuote && (
                  <>
                    <RestDocumentsInput
                      entity="contacts"
                      label="Client"
                      ctrl={ctrl("client")}
                      icon={(p) => <UserIcon {...p} />}
                      size="xl"
                    />
                    <RestDocumentsInput
                      entity="contacts"
                      filter={
                        { parents: ctrl("client").value } as Partial<Contacts>
                      }
                      label="Contacts (optionnel)"
                      ctrl={ctrl("contact")}
                      icon={(p) => <EnvelopeIcon {...p} />}
                      size="xl"
                    />
                  </>
                )}
                {(isSupplierInvoice || isSupplierQuote) && (
                  <RestDocumentsInput
                    entity="contacts"
                    label="Fournisseur"
                    ctrl={ctrl("supplier")}
                    icon={(p) => <BuildingStorefrontIcon {...p} />}
                    size="xl"
                  />
                )}
              </PageColumns>
              {hasClientOrSupplier && (
                <>
                  <PageColumns>
                    <InputButton
                      ctrl={ctrl("name")}
                      placeholder="Titre interne"
                      icon={(p) => <DocumentTextIcon {...p} />}
                    />
                    <TagsInput ctrl={ctrl("tags")} />
                    <UsersInput ctrl={ctrl("assigned")} />
                  </PageColumns>
                </>
              )}
            </div>
            {hasClientOrSupplier && (
              <>
                <Section className="mb-2">Contenu</Section>

                <InvoiceLinesInput
                  ctrl={ctrl}
                  readonly={readonly}
                  value={draft}
                  onChange={setDraft}
                />

                {false && (
                  <>
                    <div className="space-y-2">
                      <div className="space-y-2 mb-4">
                        {draft.content?.map((item, index) => (
                          <PageBlock
                            key={index}
                            closable
                            title={item?.name || `Ligne #${index + 1}`}
                          >
                            <div className="space-y-2">
                              <PageColumns>
                                <FormInput
                                  className="w-max shrink-0"
                                  type="select"
                                  ctrl={ctrl(`content.${index}.type`)}
                                  label="Type"
                                  options={[
                                    {
                                      label: "Séparation",
                                      value: "separation",
                                    },
                                    { label: "Stockable", value: "product" },
                                    { label: "Service", value: "service" },
                                    {
                                      label: "Consommable",
                                      value: "consumable",
                                    },
                                  ]}
                                />
                                {ctrl(`content.${index}.type`).value !==
                                  "separation" && (
                                  <FormInput
                                    className="w-max"
                                    ctrl={ctrl(`content.${index}.reference`)}
                                    label="Référence"
                                  />
                                )}
                                <FormInput
                                  ctrl={ctrl(`content.${index}.name`)}
                                  label="Titre"
                                />
                              </PageColumns>
                              <FormInput
                                ctrl={ctrl(`content.${index}.description`)}
                                label="Description"
                              />
                              {ctrl(`content.${index}.type`).value !==
                                "separation" && (
                                <>
                                  <PageColumns>
                                    <FormInput
                                      ctrl={ctrl(`content.${index}.unit`)}
                                      label="Unité"
                                      options={unitOptions}
                                    />
                                    <FormInput
                                      type="formatted"
                                      format="price"
                                      ctrl={ctrl(`content.${index}.unit_price`)}
                                      label="Prix unitaire HT"
                                    />
                                    <FormInput
                                      type="number"
                                      ctrl={ctrl(`content.${index}.quantity`)}
                                      label="Quantité"
                                    />
                                    <FormInput
                                      type="select"
                                      ctrl={ctrl(`content.${index}.tva`)}
                                      label="TVA"
                                      options={tvaOptions}
                                    />
                                  </PageColumns>
                                  <FormInput
                                    type="boolean"
                                    placeholder="Réduction"
                                    onChange={(e) =>
                                      ctrl(
                                        `content.${index}.discount.mode`
                                      ).onChange(e ? "amount" : null)
                                    }
                                    value={
                                      !!ctrl(`content.${index}.discount.mode`)
                                        .value
                                    }
                                  />
                                  {!!ctrl(`content.${index}.discount.mode`)
                                    ?.value && (
                                    <PageColumns>
                                      <FormInput
                                        className="w-max"
                                        ctrl={ctrl(
                                          `content.${index}.discount.mode`
                                        )}
                                        label="Type de remise"
                                        type="select"
                                        options={[
                                          { label: "Montant", value: "amount" },
                                          {
                                            label: "Pourcentage",
                                            value: "percentage",
                                          },
                                        ]}
                                      />
                                      <FormInput
                                        className="w-max"
                                        ctrl={ctrl(
                                          `content.${index}.discount.value`
                                        )}
                                        label="Valeur"
                                        type="formatted"
                                        format={
                                          draft.content?.[index]?.discount
                                            ?.mode === "percentage"
                                            ? "percentage"
                                            : "price"
                                        }
                                      />
                                      <div className="grow" />
                                    </PageColumns>
                                  )}
                                  <div>
                                    <PageBlockHr />
                                    <PageColumns>
                                      <FormInput
                                        type="boolean"
                                        ctrl={ctrl(`content.${index}.optional`)}
                                        placeholder="Optionnel"
                                      />
                                      {ctrl(`content.${index}.optional`)
                                        ?.value && (
                                        <FormInput
                                          type="boolean"
                                          ctrl={ctrl(
                                            `content.${index}.optional_checked`
                                          )}
                                          placeholder="Option sélectionnée"
                                        />
                                      )}
                                    </PageColumns>
                                    <Info>
                                      Un article optionnel peut être coché par
                                      le client ou non une fois le devis envoyé.
                                    </Info>
                                  </div>
                                </>
                              )}
                            </div>
                          </PageBlock>
                        ))}
                      </div>

                      {!readonly && (
                        <PageColumns>
                          <InputLabel
                            label="Ajouter une ligne"
                            input={
                              <Button
                                size="md"
                                theme="default"
                                onClick={() =>
                                  setDraft({
                                    ...draft,
                                    content: [
                                      ...(draft.content || []),
                                      {
                                        type: "separation",
                                      },
                                    ],
                                  })
                                }
                              >
                                + Ajouter une ligne
                              </Button>
                            }
                          />
                          <FormInput
                            className="w-max"
                            type="rest_documents"
                            rest={{ table: "articles" }}
                            label="Ajouter un article"
                            onChange={(_id, e: Articles) => {
                              setDraft({
                                ...draft,
                                content: [
                                  ...(draft.content || []),
                                  {
                                    article: e.id,
                                    type: e.type,
                                    name: e.name,
                                    description: e.description,
                                    reference: e.internal_reference,
                                    unit: e.unit,
                                    quantity: 1,
                                    unit_price: e.price,
                                    tva: e.tva,
                                  },
                                ],
                              });
                            }}
                          />
                        </PageColumns>
                      )}
                    </div>
                    {(!readonly || !!draft.discount?.mode) && <PageHr />}
                    <div className="space-y-2">
                      {!readonly && (
                        <FormInput
                          className="-mt-1"
                          type="boolean"
                          placeholder="Appliquer une remise globale"
                          value={!!ctrl("discount.mode").value}
                          onChange={(e) =>
                            ctrl("discount.mode").onChange(e ? "amount" : null)
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
                  </>
                )}

                <PageBlock title="Liens">
                  <Info>Aucun document n'est lié à ce devis.</Info>
                </PageBlock>

                <PageBlock closable title="Informations additionelles">
                  <div className="space-y-2">
                    <FormInput
                      type="date"
                      label="Date d'émission de la facture"
                      ctrl={ctrl("emit_date")}
                    />

                    {!isSupplierInvoice && !isSupplierQuote && (
                      <>
                        <PageBlockHr />
                        <FormInput
                          type="files"
                          label="Documents partagés avec le client"
                          ctrl={ctrl("attachments")}
                        />
                      </>
                    )}
                  </div>
                  <div className="">
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
                    {ctrl("delivery_address").value && (
                      <>
                        <AddressInput ctrl={ctrl("delivery_address")} />
                      </>
                    )}
                  </div>
                </PageBlock>
                {!isSupplierInvoice && !isSupplierQuote && (
                  <PageBlock
                    closable
                    title="Paiement"
                    initOpen={
                      !!(
                        !_.isEqual(
                          ctrl("payment_information").value,
                          client.payment
                        ) ||
                        (client.preferences?.currency &&
                          ctrl("currency").value !==
                            client.preferences?.currency)
                      )
                    }
                  >
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
                )}
                {!isSupplierInvoice && !isSupplierQuote && (
                  <PageBlock
                    closable
                    title="Format"
                    initOpen={
                      !!(
                        !_.isEqual(ctrl("format").value, client.invoices) ||
                        (client.preferences?.language &&
                          ctrl("language").value !==
                            client.preferences?.language)
                      )
                    }
                  >
                    <FormInput
                      label="Langue"
                      className="w-max mb-4"
                      ctrl={ctrl("language")}
                      type="select"
                      options={languageOptions}
                    />
                    <PageBlockHr />
                    <InvoiceFormatInput
                      readonly={readonly}
                      ctrl={ctrl("format")}
                    />
                  </PageBlock>
                )}
                {draft.type === "invoices" && (
                  <PageBlock closable title="Rappels" initOpen={false}>
                    <Info>
                      Envoyez un rappel toutes les semaines lorsque votre
                      facture passe en attente de paiement tant que le paiement
                      n'est pas effectué.
                    </Info>
                    <FormInput
                      type="boolean"
                      placeholder="Activer les rappels"
                      ctrl={ctrl("reminders.enabled")}
                    />
                    {ctrl("reminders.enabled").value && (
                      <div className="space-y-2">
                        <FormInput
                          type="number"
                          label="Nombre de rappels"
                          ctrl={ctrl("reminders.repetitions")}
                        />
                        <FormInput
                          type="multiselect"
                          label="Destinataires"
                          onChange={(e) =>
                            ctrl("reminders.recipients").onChange(e)
                          }
                          value={ctrl("reminders.recipients").value}
                          options={async (query: string) => [
                            ...(ctrl("reminders.recipients").value || []).map(
                              (r: string) => ({
                                value: r as string,
                                label: r as string,
                              })
                            ),
                            ...(query
                              .toLocaleLowerCase()
                              .match(
                                /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g
                              )
                              ? [{ value: query, label: query }]
                              : []),
                          ]}
                        />
                      </div>
                    )}
                  </PageBlock>
                )}
                {draft.type === "invoices" && (
                  <PageBlock closable title="Récurrence" initOpen={false}>
                    <Info>
                      Activez la récurrence pour dupliquer cette facture
                      automatiquement.
                    </Info>
                    <FormInput
                      type="boolean"
                      placeholder="Activer la récurrence"
                      onChange={(e) => {
                        setDraft({
                          ...draft,
                          subscription: {
                            enabled: e,
                            frequency:
                              draft?.subscription?.frequency || "monthly",
                            start: draft?.subscription?.start || Date.now(),
                            end:
                              draft?.subscription?.end ||
                              Date.now() + 1000 * 60 * 60 * 24 * 365,
                            as_draft: true,
                          },
                        });
                      }}
                      value={ctrl("subscription.enabled").value}
                    />
                    {ctrl("subscription.enabled").value && (
                      <>
                        <PageColumns>
                          <FormInput
                            type="select"
                            label="Fréquence"
                            ctrl={ctrl("subscription.frequency")}
                            options={[
                              { value: "weekly", label: "Hebdomadaire" },
                              { value: "monthly", label: "Mensuelle" },
                              { value: "yearly", label: "Annuelle" },
                            ]}
                          />
                          <FormInput
                            type="date"
                            label="Début (inclus)"
                            ctrl={ctrl("subscription.start")}
                          />
                          <FormInput
                            type="date"
                            label="Fin (inclus)"
                            ctrl={ctrl("subscription.end")}
                          />
                        </PageColumns>

                        <div className="mt-2" />
                        <Info>
                          Prochaines factures:{" "}
                          {(() => {
                            let hasMore = false;
                            const dates = [];
                            let date = Math.max(
                              new Date(draft.emit_date || 0).getTime(),
                              new Date(draft.subscription?.start || 0).getTime()
                            );
                            let end = Math.max(
                              new Date(draft.emit_date || 0).getTime(),
                              new Date(draft.subscription?.end || 0).getTime() +
                                1000 * 60 * 60 * 24 // Add a day for time zones issues
                            );
                            while (date <= end) {
                              dates.push(date);
                              const nextDate = new Date(date);
                              if (draft.subscription?.frequency === "weekly")
                                nextDate.setDate(nextDate.getDate() + 7);
                              else if (
                                draft.subscription?.frequency === "monthly"
                              )
                                nextDate.setMonth(nextDate.getMonth() + 1);
                              else
                                nextDate.setFullYear(
                                  nextDate.getFullYear() + 1
                                );
                              if (dates.length > 25) {
                                hasMore = true;
                                break;
                              }
                              date = nextDate.getTime();
                            }
                            return [
                              ...dates.map((d) => (
                                <Tag
                                  icon={<></>}
                                  key={d}
                                  noColor
                                  className="bg-white mr-1 mb-1 text-slate-800"
                                >
                                  {formatTime(d, {
                                    keepDate: true,
                                    hideTime: true,
                                  })}
                                </Tag>
                              )),
                              ...(hasMore
                                ? [
                                    <Tag
                                      icon={<></>}
                                      key={"..."}
                                      noColor
                                      className="bg-white mr-1 mb-1 text-slate-800"
                                    >
                                      ...
                                    </Tag>,
                                  ]
                                : []),
                            ];
                          })()}
                        </Info>

                        <PageBlockHr />
                        <FormInput
                          type="boolean"
                          placeholder="Dupliquer en tant que brouillon"
                          ctrl={ctrl("subscription.as_draft")}
                        />
                        <Info>
                          Par défaut les factures sont dupliquées et envoyées au
                          client pour paiement (tacite reconduction).
                        </Info>
                      </>
                    )}
                  </PageBlock>
                )}
                <PageBlock closable title="Champs additionels">
                  <CustomFieldsInput
                    table={"invoices"}
                    ctrl={ctrl("fields")}
                    readonly={readonly}
                    entityId={draft.id || ""}
                  />
                </PageBlock>

                <div className="mt-6">
                  <SectionSmall>Notes et documents</SectionSmall>
                  <div className="space-y-2 mt-2">
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
                    <FilesInput
                      ctrl={ctrl("documents")}
                      rel={{
                        table: "invoices",
                        id: draft.id || "",
                        field: "documents",
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          {/* TODO Clearly this fixed isn't right for all screens, we should use js probably ? */}
          <div
            className={twMerge(
              "lg:w-2/5 shrink-0 flex items-start justify-center pt-6 transition-all",
              !hasPreview && "w-0 lg:w-0",
              hasPreview && "w-full"
            )}
          >
            {hasPreview && (
              <div className="fixed grow shrink-0">
                <div className="w-full flex flex-col grow shadow-lg border overflow-x-auto max-w-[560px] lg:aspect-[5/7] bg-white">
                  <InvoicesPreview invoice={draft} />
                </div>
              </div>
            )}
          </div>
          <div className="grow" />
        </PageColumns>
      </FormContext>
    </>
  );
};
