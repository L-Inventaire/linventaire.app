import { Button } from "@atoms/button/button";
import { PageLoader } from "@atoms/page-loader";
import { Section } from "@atoms/text";
import { WrongNumerotationFormat } from "@atoms/wrong-format-numerotation";
import { CustomFieldsInput } from "@components/custom-fields-input";
import { FormInput } from "@components/form/fields";
import { FormContext } from "@components/form/formcontext";
import { InputButton } from "@components/input-button";
import { RestDocumentsInput } from "@components/input-rest";
import { FilesInput } from "@components/input-rest/files";
import { TagsInput } from "@components/input-rest/tags";
import { UsersInput } from "@components/input-rest/users";
import { buildQueryFromMap } from "@components/search-bar/utils/utils";
import { AccountingTransactionsColumns } from "@features/accounting/configuration";
import { useAccountingTransactions } from "@features/accounting/hooks/use-accounting-transactions";
import { AccountingTransactions } from "@features/accounting/types/types";
import { useClients } from "@features/clients/state/use-clients";
import { useContact, useContacts } from "@features/contacts/hooks/use-contacts";
import { Contacts } from "@features/contacts/types/types";
import { useEditFromCtrlK } from "@features/ctrlk/use-edit-from-ctrlk";
import { Invoices } from "@features/invoices/types/types";
import { getDocumentName } from "@features/invoices/utils";
import { ROUTES } from "@features/routes";
import { formatTime } from "@features/utils/format/dates";
import {
  getFormattedNumerotation,
  useFormattedNumerotationByInvoice,
} from "@features/utils/format/numerotation";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import {
  BuildingStorefrontIcon,
  EnvelopeIcon,
  UserIcon,
} from "@heroicons/react/20/solid";
import { EditorInput } from "@molecules/editor-input";
import { Table } from "@molecules/table";
import { Timeline } from "@molecules/timeline";
import { Callout, Code, Text } from "@radix-ui/themes";
import { PageColumns } from "@views/client/_layout/page";
import _ from "lodash";
import { Fragment, useEffect } from "react";
import { computePricesFromInvoice } from "../utils";
import { InputDelivery } from "./input-delivery";
import { InvoiceInputFormat } from "./input-format";
import { InvoicePaymentInput } from "./input-payment";
import { InvoiceRecurrenceInput } from "./input-recurrence";
import { InvoiceRecurrencePeriodInput } from "./input-recurrence-period";
import { InvoiceReminderInput } from "./input-reminder";
import { InvoiceLinesInput } from "./invoice-lines-input";
import { CompletionTags } from "./invoice-lines-input/components/completion-tags";
import { InvoiceRestDocument } from "./invoice-lines-input/invoice-input-rest-card";
import { InvoiceStatus } from "./invoice-status";
import { RelatedInvoices } from "./related-invoices";
import { TagPaymentCompletion } from "./tag-payment-completion";
import { useEffectChange } from "@features/utils/hooks/use-changed-effect";

export const computeStockCompletion = (
  linesu: Invoices["content"],
  type: "delivered" | "ready" = "ready",
  overflow = false,
  service = false
) => {
  const lines = (linesu || []).filter(
    (a) =>
      (service
        ? a.type === "service"
        : a.type === "consumable" || a.type === "product") &&
      !(a.optional && !a.optional_checked)
  );
  const total = lines.reduce(
    (acc, line) =>
      acc +
      parseFloat((line.quantity as any) || 0) *
        parseFloat((line.unit_price as any) || 0),
    0
  );
  if (total === 0) return 1;

  const column = type === "ready" ? "quantity_ready" : "quantity_delivered";

  return (
    lines.reduce(
      (acc, line) =>
        acc +
        (overflow
          ? parseFloat((line[column] as any) || 0) *
            parseFloat((line.unit_price as any) || 0)
          : Math.min(
              parseFloat((line.quantity as any) || 0) *
                parseFloat((line.unit_price as any) || 0),
              parseFloat((line[column] as any) || 0) *
                parseFloat((line.unit_price as any) || 0)
            )),
      0
    ) / total
  );
};

export const renderStockCompletion = (
  lines: Invoices["content"],
  type: "delivered" | "ready" = "ready",
  overflow = false,
  service = false
): [number, string] => {
  const value = computeStockCompletion(lines, type, overflow, service);
  const color = value < 0.5 ? "red" : value < 1 ? "orange" : "green";
  return [Math.round(value * 100), color];
};

export const computePaymentCompletion = (
  linesu: Invoices["content"],
  type: "delivered" | "ready" = "ready",
  overflow = false
) => {
  const lines = linesu || [];
  const total = lines.reduce(
    (acc, line) => acc + parseFloat((line.quantity as any) || 0),
    0
  );
  if (total === 0) return 1;

  const column = type === "ready" ? "quantity_ready" : "quantity_delivered";

  return (
    lines.reduce(
      (acc, line) =>
        acc +
        (overflow
          ? parseFloat((line[column] as any) || 0)
          : Math.min(
              parseFloat((line.quantity as any) || 0),
              parseFloat((line[column] as any) || 0)
            )),
      0
    ) / total
  );
};

export const renderPaymentCompletion = (
  lines: Invoices["content"],
  type: "delivered" | "ready" = "ready",
  overflow = false
): [number, string] => {
  const value = computeStockCompletion(lines, type, overflow);
  const color = value < 0.5 ? "red" : value < 1 ? "orange" : "green";
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
  const edit = useEditFromCtrlK();

  const isQuoteRelated =
    draft.type === "quotes" || draft.type === "supplier_quotes";
  const isSupplierInvoice =
    draft.type === "supplier_credit_notes" ||
    draft.type === "supplier_invoices";
  const isSupplierQuote = draft.type === "supplier_quotes";
  const isSupplierRelated = isSupplierInvoice || isSupplierQuote;
  const hasClientOrSupplier =
    (draft.client && !isSupplierRelated) ||
    (draft.supplier && isSupplierRelated);

  useEffectChange(
    ([prevContact]) => {
      if (prevContact && prevContact !== (draft.client || draft.supplier)) {
        setDraft((draft) => ({
          ...draft,
          contact: "",
        }));
      }
    },
    [draft.client || draft.supplier]
  );

  useEffectChange(
    ([prevContact]) => {
      if (prevContact && prevContact !== (draft.client || draft.supplier)) {
        setDraft((draft) => ({
          ...draft,
          reference: reference,
        }));
      }
    },
    [draft.client, draft.contact]
  );

  const reference = useFormattedNumerotationByInvoice(draft);

  useEffect(() => {
    if (!isPending && draft)
      setDraft((draft: Invoices) => {
        draft = _.cloneDeep(draft);
        if (!draft.emit_date) draft.emit_date = new Date().getTime();
        if (draft.type && !draft.reference) {
          draft.reference = reference;
        }
        draft.total = computePricesFromInvoice(draft);
        draft.content = (draft.content || []).map((a) => ({
          ...a,
          _id: a._id || _.uniqueId(),
        }));
        if (!draft.attachments?.length && !isSupplierRelated) {
          draft.attachments = [...(client.invoices.attachments || [])];
        }
        return draft;
      });
  }, [JSON.stringify(draft)]);

  const { accounting_transactions } = useAccountingTransactions({
    query: buildQueryFromMap({
      rel_invoices: draft.id,
    }),
  });

  const { contacts } = useContacts({
    query: buildQueryFromMap({
      parents: ctrl("client").value,
    }),
  });

  useEffect(() => {
    if (
      !readonly &&
      !ctrl("contact").value &&
      (contacts?.data?.list?.length || 0) > 0
    ) {
      ctrl("contact").onChange(contacts?.data?.list[0].id);
    }
    if (!readonly && ctrl("client").value !== draft.client) {
      ctrl("contact").onChange("");
    }
  }, [ctrl("client").value]);

  const format = _.get(client.invoices_counters, draft.type)?.format;
  const errorFormat = !format;

  if (isPending || (id && draft.id !== id) || !client) return <PageLoader />;
  if (errorFormat) return <WrongNumerotationFormat />;

  const otherInputs = _.sortBy(
    [
      {
        component: (
          <InvoiceInputFormat
            btnKey="invoice-format"
            ctrl={ctrl}
            readonly={readonly}
            client={client}
            invoice={draft}
          />
        ),
        visible: !isSupplierInvoice && !isSupplierQuote,
        with_content: !_.isEqual(
          _.omitBy(draft?.format, (a) => !a),
          _.omitBy(client.invoices, (a) => !a)
        ),
      },
      {
        component: (
          <InvoicePaymentInput
            btnKey="invoice-payment"
            invoice={draft}
            ctrl={ctrl}
            readonly={readonly}
          />
        ),
        visible: !isSupplierRelated,
        with_content: draft.payment_information?.mode?.length,
      },
      {
        component: (
          <InvoiceReminderInput
            btnKey="invoice-reminder"
            invoice={draft}
            ctrl={ctrl}
            readonly={readonly}
          />
        ),
        visible: !isSupplierRelated,
        with_content: draft.reminders?.enabled,
      },
    ].filter((a) => a.visible && (a.with_content || !readonly)),
    (a) => {
      return a.with_content ? -1 : 0;
    }
  );

  const billableContent = (draft.content || []).filter(
    (a) => a.unit_price && a.quantity && !(a.optional && !a.optional_checked)
  );

  const contentReadonly =
    readonly ||
    // Drafts are always editable
    // Demandes de prix are also a special case where the client can edit the content
    !(draft.state === "draft" || (draft.state === "sent" && isSupplierQuote));

  return (
    <>
      <FormContext readonly={readonly} alwaysVisible>
        <PageColumns>
          <div className="grow lg:w-3/5 max-w-3xl pt-6 mx-auto">
            {readonly && (
              <>
                {draft.state === "draft" && (
                  <Callout.Root className="mb-4">
                    <Callout.Text>
                      Ce document est un <Text weight="bold">brouillon</Text>.
                    </Callout.Text>
                  </Callout.Root>
                )}

                {!isSupplierRelated && (
                  <>
                    {draft.state === "sent" && isQuoteRelated && (
                      <Callout.Root className="mb-4" color="blue">
                        <Callout.Text>
                          Le devis a été envoyé au client et est{" "}
                          <Text weight="bold">en attente d'acceptation</Text>.
                        </Callout.Text>
                      </Callout.Root>
                    )}
                    {draft.state === "purchase_order" && isQuoteRelated && (
                      <Callout.Root className="mb-4" color="orange">
                        <Callout.Text>
                          Le devis a été accepté part le client, certaines
                          lignes ne sont pas encore complétées.
                        </Callout.Text>
                      </Callout.Root>
                    )}
                  </>
                )}

                {!!isSupplierRelated && (
                  <>
                    {draft.state === "sent" && isQuoteRelated && (
                      <Callout.Root className="mb-4" color="red">
                        <Callout.Text>
                          Commande{" "}
                          <Text weight="bold">en attente de validation</Text>{" "}
                          par le fournisseur.
                        </Callout.Text>
                      </Callout.Root>
                    )}
                    {draft.state === "purchase_order" && isQuoteRelated && (
                      <Callout.Root className="mb-4" color="orange">
                        <Callout.Text>
                          La commande a été accepté part le fournisseur, elle
                          est en transit.
                        </Callout.Text>
                      </Callout.Root>
                    )}
                  </>
                )}
              </>
            )}

            <div className="mb-2 flex flex-row">
              <InvoiceStatus
                readonly={true}
                size="sm"
                value={draft.state}
                type={draft.type}
                onChange={(value) => setDraft({ ...draft, state: value })}
              />
              <div className="grow" />
              {draft.type === "invoices" && (
                <TagPaymentCompletion invoice={draft} />
              )}
            </div>
            <div className="float-right space-x-2">
              <TagsInput ctrl={ctrl("tags")} />
              <UsersInput ctrl={ctrl("assigned")} />
            </div>

            <FormContext readonly={contentReadonly} alwaysVisible>
              <Section className="flex items-center space-x-2">
                <span>
                  {getDocumentName(draft.type) + " " + ctrl("reference").value}
                </span>

                {(!readonly || ctrl("emit_date").value) && (
                  <InputButton
                    theme="invisible"
                    className="m-0"
                    data-tooltip={new Date(
                      ctrl("emit_date").value
                    ).toDateString()}
                    ctrl={ctrl("emit_date")}
                    placeholder="Date d'emission"
                    value={formatTime(ctrl("emit_date").value || 0)}
                    content={() => (
                      <FormInput ctrl={ctrl("emit_date")} type="date" />
                    )}
                    readonly={readonly}
                  >
                    <Text size="2" className="opacity-75" weight="medium">
                      {"Émis le "}
                      {formatTime(ctrl("emit_date").value || 0, {
                        hideTime: true,
                      })}
                    </Text>
                  </InputButton>
                )}
                {!!draft.subscription_next_invoice_date &&
                  draft.type === "quotes" &&
                  draft.state === "recurring" && (
                    <Text size="2" className="opacity-75" weight="medium">
                      {"Prochaine facture le "}
                      {formatTime(draft.subscription_next_invoice_date || 0, {
                        hideTime: true,
                      })}
                    </Text>
                  )}
                {!!ctrl("wait_for_completion_since").value && (
                  <InputButton
                    theme="invisible"
                    className="m-0"
                    data-tooltip={new Date(
                      ctrl("wait_for_completion_since").value || Date.now()
                    ).toDateString()}
                    ctrl={ctrl("wait_for_completion_since") || Date.now()}
                    placeholder="Date de signature"
                    value={formatTime(
                      ctrl("wait_for_completion_since").value || Date.now()
                    )}
                    content={() => (
                      <FormInput
                        ctrl={ctrl("wait_for_completion_since") || Date.now()}
                        type="date"
                      />
                    )}
                    readonly={readonly}
                  >
                    <Text size="2" className="opacity-75" weight="medium">
                      {"Accepté le "}
                      {formatTime(
                        ctrl("wait_for_completion_since").value || Date.now(),
                        {
                          hideTime: true,
                        }
                      )}
                    </Text>
                  </InputButton>
                )}
              </Section>
              {(!readonly || ctrl("name").value) && (
                <InputButton
                  theme="invisible"
                  size="sm"
                  className="-mx-1 px-1"
                  ctrl={ctrl("name")}
                  placeholder="Désignation"
                />
              )}

              {contentReadonly && !readonly && (
                <Callout.Root className="my-4">
                  <Callout.Text>
                    Le contenu et les clients de ce document ne sont plus
                    modifiables.
                  </Callout.Text>
                </Callout.Root>
              )}
              <div className="space-y-2 mb-6 mt-4">
                <PageColumns>
                  {!isSupplierInvoice && !isSupplierQuote && (
                    <>
                      <RestDocumentsInput
                        entity="contacts"
                        label="Client"
                        ctrl={ctrl("client")}
                        icon={(p) => <UserIcon {...p} />}
                        size="xl"
                        filter={
                          {
                            is_client: true,
                          } as Partial<Contacts>
                        }
                      />
                      {((!readonly && ctrl("client").value) ||
                        ctrl("contact").value) && (
                        <RestDocumentsInput
                          entity="contacts"
                          filter={
                            {
                              parents: ctrl("client").value,
                            } as Partial<Contacts>
                          }
                          label="Contact (optionnel)"
                          ctrl={ctrl("contact")}
                          icon={(p) => <EnvelopeIcon {...p} />}
                          size="xl"
                        />
                      )}
                    </>
                  )}
                  {(isSupplierInvoice || isSupplierQuote) && (
                    <RestDocumentsInput
                      entity="contacts"
                      label="Fournisseur"
                      ctrl={ctrl("supplier")}
                      icon={(p) => <BuildingStorefrontIcon {...p} />}
                      size="xl"
                      filter={
                        {
                          is_supplier: true,
                        } as Partial<Contacts>
                      }
                    />
                  )}
                </PageColumns>
              </div>
              {hasClientOrSupplier && (
                <>
                  <Section className="mb-2">
                    Contenu <Code>{billableContent.length}</Code>
                    {!!billableContent?.length && isQuoteRelated && (
                      <div className="inline-block float-right">
                        <CompletionTags
                          size="sm"
                          invoice={draft}
                          lines={draft.content}
                        />
                      </div>
                    )}
                  </Section>
                  <InvoiceLinesInput value={draft} onChange={setDraft} />
                  {billableContent.length > 0 && (
                    <>
                      {draft.type === "quotes" &&
                        draft.state !== "closed" &&
                        !!draft.content?.find((a) => a.subscription) && (
                          <div className="mt-8">
                            <Section className="mb-2">Récurrence</Section>
                            <InvoiceRecurrenceInput
                              btnKey="invoice-recurrence"
                              invoice={draft}
                              ctrl={ctrl}
                              readonly={readonly}
                            />
                          </div>
                        )}

                      {!isSupplierRelated &&
                        draft.type !== "quotes" &&
                        !!draft.content?.find((a) => a.subscription) && (
                          <div className="mt-8">
                            <Section className="mb-2">
                              Période de récurrence
                            </Section>
                            <InvoiceRecurrencePeriodInput
                              btnKey="invoice-recurrence-period"
                              invoice={draft}
                              ctrl={ctrl}
                              readonly={readonly}
                            />
                          </div>
                        )}

                      {!isSupplierRelated && (
                        <div className="mt-8">
                          <Section className="mb-2">Livraison</Section>
                          <InputDelivery
                            btnKey="invoice-delivery"
                            invoice={draft}
                            ctrl={ctrl}
                            readonly={readonly}
                            contact={contact}
                          />
                        </div>
                      )}

                      {!!otherInputs.length && (
                        <div className="mt-8">
                          <Section className="mb-2">Autre</Section>
                          <div className="m-grid-1">
                            {otherInputs.map((a, i) => (
                              <Fragment key={i}>
                                {i !== 0 &&
                                  !a.with_content &&
                                  !!otherInputs[i - 1].with_content && <br />}
                                {a.component}
                              </Fragment>
                            ))}
                          </div>
                        </div>
                      )}

                      {!isQuoteRelated &&
                        readonly &&
                        draft.state !== "draft" && (
                          <div className="mt-8">
                            {!isQuoteRelated && readonly && (
                              <div className="float-right">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    edit<AccountingTransactions>(
                                      "accounting_transactions",
                                      "",
                                      {
                                        rel_invoices: [draft.id],
                                        currency: draft.currency,
                                        amount:
                                          draft.total?.total_with_taxes || 0,
                                        reference: draft.reference,
                                      }
                                    )
                                  }
                                >
                                  Enregistrer un paiement
                                </Button>
                              </div>
                            )}
                            <Section className="mb-2">Paiements</Section>
                            <Table
                              data={accounting_transactions.data?.list || []}
                              columns={AccountingTransactionsColumns()}
                            />
                          </div>
                        )}

                      {(!isQuoteRelated ||
                        draft?.type === "invoices" ||
                        isSupplierInvoice ||
                        isSupplierQuote) && (
                        <div className="mt-8">
                          <Section className="mb-2">Origine</Section>
                          <InvoiceRestDocument
                            disabled={readonly}
                            label="Devis d'origine"
                            placeholder="Aucun devis"
                            ctrl={ctrl("from_rel_quote")}
                            filter={
                              {
                                type: isSupplierRelated
                                  ? isSupplierQuote
                                    ? "quotes"
                                    : "supplier_quotes"
                                  : "quotes",
                                "articles.all": [
                                  ...(draft.content || [])
                                    .map((a) => a.article)
                                    .filter(Boolean),
                                ],
                              } as Partial<Invoices>
                            }
                            size="xl"
                            max={1}
                          />
                        </div>
                      )}

                      {readonly && (
                        <RelatedInvoices
                          invoice={draft}
                          className="mt-8"
                          readonly={readonly}
                        />
                      )}
                    </>
                  )}{" "}
                </>
              )}
            </FormContext>

            {hasClientOrSupplier && !!billableContent.length && (
              <>
                <CustomFieldsInput
                  className="mt-8"
                  table={"invoices"}
                  ctrl={ctrl("fields")}
                  readonly={readonly}
                  entityId={draft.id || ""}
                />

                <div className="mt-8">
                  <Section className="mb-2">
                    Notes et documents internes
                  </Section>
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
                    {(!readonly || ctrl("documents").value?.length) && (
                      <FilesInput
                        disabled={readonly}
                        ctrl={ctrl("documents")}
                        rel={{
                          table: "invoices",
                          id: draft.id || "",
                          field: "documents",
                        }}
                      />
                    )}
                  </div>
                </div>
                <br />
                <br />
                <Timeline
                  entity="invoices"
                  id={draft.id}
                  viewRoute={ROUTES.InvoicesView}
                />
              </>
            )}
            <br />
            <br />
          </div>
        </PageColumns>
      </FormContext>
    </>
  );
};
