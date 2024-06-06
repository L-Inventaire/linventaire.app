import { Dot } from "@atoms/badge/dot";
import { Tag } from "@atoms/badge/tag";
import { Button } from "@atoms/button/button";
import { InputLabel } from "@atoms/input/input-decoration-label";
import { Info, SectionSmall } from "@atoms/text";
import { AddressInput } from "@components/address-input";
import { CustomFieldsInput } from "@components/custom-fields-input";
import { EditorInput } from "@components/editor-input";
import { FormInput } from "@components/form/fields";
import { FormContext } from "@components/form/formcontext";
import { InvoiceFormatInput } from "@components/invoice-format-input";
import { PageLoader } from "@components/page-loader";
import { PaymentInput } from "@components/payment-input";
import { Articles } from "@features/articles/types/types";
import { useClients } from "@features/clients/state/use-clients";
import { useContact } from "@features/contacts/hooks/use-contacts";
import { Invoices } from "@features/invoices/types/types";
import {
  currencyOptions,
  invoicesAlikeStatus,
  languageOptions,
  tvaOptions,
  unitOptions,
} from "@features/utils/constants";
import { formatTime } from "@features/utils/format/dates";
import { getFormattedNumerotation } from "@features/utils/format/numerotation";
import { formatAmount } from "@features/utils/format/strings";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  PageBlock,
  PageBlockHr,
  PageColumns,
} from "@views/client/_layout/page";
import { jsPDF } from "jspdf";
import _ from "lodash";
import { useEffect } from "react";
import { computePricesFromInvoice } from "../utils";
import { InvoicesPreview } from "./invoices-preview/invoices-preview";

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

  const status = invoicesAlikeStatus;

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
        return draft;
      });
  }, [JSON.stringify(draft)]);

  if (isPending || (id && draft.id !== id) || !client) return <PageLoader />;

  return (
    <>
      <FormContext readonly={readonly} alwaysVisible>
        <PageColumns>
          <div className="grow lg:w-3/5">
            <PageBlock title={"Devis " + ctrl("reference").value}>
              <div className="space-y-2">
                <div className="mb-4">
                  <PageColumns>
                    <FormInput
                      ctrl={ctrl("name")}
                      label="Titre"
                      placeholder="Titre interne"
                    />
                  </PageColumns>
                </div>
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
            {draft.client && (
              <>
                <PageBlock title="Prestations">
                  <div className="space-y-2">
                    <div className="space-y-2 mb-4">
                      {draft.content?.map((item, index) => (
                        <PageBlock
                          key={index}
                          closable
                          title={item?.name || `Ligne #${index + 1}`}
                          actions={
                            !readonly && (
                              <>
                                <Button
                                  disabled={index === 0}
                                  theme="default"
                                  size="sm"
                                  onClick={() => {
                                    const content = _.cloneDeep(
                                      draft.content || []
                                    );
                                    const temp = content[index];
                                    content[index] = content[index - 1];
                                    content[index - 1] = temp;
                                    setDraft({
                                      ...draft,
                                      content,
                                    });
                                  }}
                                  icon={(p) => <ArrowUpIcon {...p} />}
                                />
                                <Button
                                  disabled={
                                    index === (draft.content?.length || 0) - 1
                                  }
                                  theme="default"
                                  size="sm"
                                  onClick={() => {
                                    const content = _.cloneDeep(
                                      draft.content || []
                                    );
                                    const temp = content[index];
                                    content[index] = content[index + 1];
                                    content[index + 1] = temp;
                                    setDraft({
                                      ...draft,
                                      content,
                                    });
                                  }}
                                  icon={(p) => <ArrowDownIcon {...p} />}
                                />
                                <Button
                                  theme="danger"
                                  size="sm"
                                  onClick={() =>
                                    setDraft({
                                      ...draft,
                                      content: draft.content?.filter(
                                        (e, i) => i !== index
                                      ),
                                    })
                                  }
                                  icon={(p) => <TrashIcon {...p} />}
                                />
                              </>
                            )
                          }
                        >
                          <div className="space-y-2">
                            <PageColumns>
                              <FormInput
                                className="w-max shrink-0"
                                type="select"
                                ctrl={ctrl(`content.${index}.type`)}
                                label="Type"
                                options={[
                                  { label: "Séparation", value: "separation" },
                                  { label: "Produit", value: "product" },
                                  { label: "Service", value: "service" },
                                  { label: "Consommable", value: "consumable" },
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
                                  ctrl={ctrl(`content.${index}.discount.mode`)}
                                  placeholder="Réduction"
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
                                          ?.mode === "amount"
                                          ? "price"
                                          : "percentage"
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
                                    Un article optionnel peut être coché par le
                                    client ou non une fois le devis envoyé.
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
                              size="sm"
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
                          rest={{ table: "invoices", column: "articles.all" }}
                          label="Ajouter un article"
                          max={1}
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
                  {(!readonly || !!draft.discount?.mode) && <PageBlockHr />}
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
                            <span>
                              {formatAmount(draft.total?.discount || 0)}
                            </span>
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
                        <SectionSmall className="inline">
                          Total TTC
                        </SectionSmall>
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
                        ctrl("currency").value !== client.preferences?.currency)
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
                <PageBlock
                  closable
                  title="Format"
                  initOpen={
                    !!(
                      !_.isEqual(ctrl("format").value, client.invoices) ||
                      (client.preferences?.language &&
                        ctrl("language").value !== client.preferences?.language)
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
                          Par défaut les factures son dupliquées et envoyées au
                          client pour paiement (tacite reconduction).
                        </Info>
                      </>
                    )}
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
              </>
            )}
          </div>
          {draft.client && (
            <div className="grow lg:w-2/5 shrink-0">
              <PageBlock title="Status">
                <div className="inline-flex items-center space-x-2 w-full">
                  <Dot
                    className={status[draft.type][draft.state || "draft"][1]}
                  />
                  <FormInput
                    className="grow"
                    ctrl={ctrl("state")}
                    type="select"
                    options={Object.keys(status[draft.type]).map((k) => ({
                      value: k as string,
                      label: status[draft.type][k][0] as string,
                    }))}
                  />
                </div>

                <PageBlockHr />

                <Info>Aucun document n'est lié à ce devis.</Info>

                <PageBlockHr />
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
              </PageBlock>

              <div className="w-full flex flex-col grow shadow-md overflow-x-auto">
                <Button
                  className="w-full"
                  onClick={() => {
                    let element = document.getElementById("invoice-preview");
                    const doc = new jsPDF({
                      orientation: "portrait",
                      unit: "pt",
                      format: [842, 595],
                    });
                    doc.setCharSpace(0);

                    doc.html(element ?? "<div>ERROR</div>", {
                      callback: function (doc) {
                        async function addFooters() {
                          const pageCount = doc.getNumberOfPages();
                          for (var i = 1; i <= pageCount; i++) {
                            doc.addImage(
                              "data:image/png;base64,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",
                              "PNG",
                              550,
                              800,
                              20,
                              20
                            );

                            doc.textWithLink("linventaire.app", 475, 814, {
                              url: "https://linventaire.app",
                            });

                            doc.text(
                              "Page " + String(i) + "/" + pageCount,
                              20,
                              820
                            );
                          }
                        }

                        addFooters();
                        doc.save();
                      },
                      html2canvas: {
                        letterRendering: true,
                      },
                      x: 10,
                      y: 10,
                    });
                  }}
                >
                  Télécharger
                </Button>
                <InvoicesPreview invoice={draft} />
              </div>
            </div>
          )}
        </PageColumns>
      </FormContext>
    </>
  );
};
