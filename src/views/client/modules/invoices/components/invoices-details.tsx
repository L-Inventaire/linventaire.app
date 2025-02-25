import { Button } from "@atoms/button/button";
import { PageLoader } from "@atoms/page-loader";
import { BaseSmall, Info, Section } from "@atoms/text";
import { WrongNumerotationFormat } from "@atoms/wrong-format-numerotation";
import { CustomFieldsInput } from "@components/custom-fields-input";
import { FormInput } from "@components/form/fields";
import { FormContext } from "@components/form/formcontext";
import { InputButton } from "@components/input-button";
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
import { InvoicesFieldsNames } from "@features/invoices/configuration";
import { useInvoice, useInvoices } from "@features/invoices/hooks/use-invoices";
import { Invoices } from "@features/invoices/types/types";
import { getDocumentName, getInvoiceNextDate } from "@features/invoices/utils";
import { ROUTES } from "@features/routes";
import { formatTime } from "@features/utils/format/dates";
import { format as formatdfns } from "date-fns";
import {
  getFormattedNumerotation,
  getOptimalCounterFormat,
  useFormattedNumerotationByInvoice,
} from "@features/utils/format/numerotation";
import { useEffectChange } from "@features/utils/hooks/use-changed-effect";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import {
  ExclamationCircleIcon,
  PlayCircleIcon,
} from "@heroicons/react/16/solid";
import {
  BuildingStorefrontIcon,
  EnvelopeIcon,
  UserIcon,
} from "@heroicons/react/20/solid";
import { EditorInput } from "@molecules/editor-input";
import { Table } from "@molecules/table";
import { Timeline } from "@molecules/timeline";
import { Callout, Code, Heading, Text, Tooltip } from "@radix-ui/themes";
import { PageColumns } from "@views/client/_layout/page";
import { format as formatDate } from "date-fns";
import _ from "lodash";
import { DateTime } from "luxon";
import { Fragment, useEffect } from "react";
import { ContactRestDocument } from "../../contacts/components/contact-input-rest-card";
import { computePaymentDelayDate, computePricesFromInvoice } from "../utils";
import { getBestDeliveryAddress, InputDelivery } from "./input-delivery";
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
import { format as formatfns } from "date-fns";
import { Clients } from "@features/clients/types/clients";

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

  const { contact: invoiceCounterParty } = useContact(
    draft.client || draft.supplier
  );
  const { contact: invoiceContact } = useContact(draft.contact);
  const edit = useEditFromCtrlK();

  const { invoice: originQuote } = useInvoice(draft.from_rel_quote?.[0] || "");

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
          reference: getReference(draft),
        }));
      }
    },
    [draft.client, draft.contact]
  );

  const getReference = useFormattedNumerotationByInvoice();

  useEffect(() => {
    if (!isPending && draft)
      setDraft((draft: Invoices) => {
        draft = _.cloneDeep(draft);
        if (!draft.emit_date) draft.emit_date = new Date().getTime();
        if (draft.type && !draft.reference && draft.emit_date) {
          draft.reference = getReference(draft);
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

  /**
   * _ si un produit / consommable est ajouté, alors 1. la livraison doit être cochée toute seule
   */
  useEffectChange(() => {
    setDraft((draft) => {
      draft = _.cloneDeep(draft);
      if (
        draft.content?.some(
          (a) => a.type === "product" || a.type === "consumable"
        )
      ) {
        draft.delivery_delay = 30; // TODO ability to set the default somewhere in the app
        draft.delivery_address = getBestDeliveryAddress(
          invoiceCounterParty!,
          invoiceContact || undefined
        );
      }
      return draft;
    });
  }, [draft.client, draft.supplier, draft.contact, draft.content?.length]);

  const { accounting_transactions } = useAccountingTransactions({
    query: buildQueryFromMap({
      rel_invoices: draft.id,
    }),
    limit: draft.id ? 100 : 0,
  });

  const { contacts } = useContacts({
    query: buildQueryFromMap({
      parents: ctrl("client").value,
    }),
  });

  useEffectChange(() => {
    if (!readonly) {
      if (
        ctrl("client").value &&
        !ctrl("contact").value &&
        (contacts?.data?.list?.length || 0) > 0
      ) {
        ctrl("contact").onChange(contacts?.data?.list[0].id);
      } else {
        ctrl("contact").onChange("");
      }
    }
  }, [ctrl("client").value, JSON.stringify(contacts?.data?.list)]);

  const format = getOptimalCounterFormat(
    client.invoices_counters,
    draft.type,
    draft.emit_date
  )?.format;
  const errorFormat = !format;

  if (isPending || (id && draft.id !== id) || !client) return <PageLoader />;
  if (errorFormat) return <WrongNumerotationFormat />;

  const otherInputs = _.sortBy(
    [
      {
        component: (
          <InvoicePaymentInput
            btnKey="invoice-payment"
            invoice={draft}
            ctrl={ctrl}
            readonly={readonly}
            noResetToDefault={true}
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
        visible: false && !isSupplierRelated,
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
    // Sent invoices and accepted quotes cannot be modified
    (draft.state !== "draft" &&
      (draft.type === "invoices" || draft.type === "credit_notes")) ||
    (draft.state !== "draft" &&
      draft.state !== "sent" &&
      draft.state !== "recurring" &&
      draft.type === "quotes") ||
    // Paid supplier invoices cannot be modified
    ((draft.type === "supplier_invoices" || draft.type === "supplier_quotes") &&
      draft.state === "closed") ||
    // Closed documents cannot be modified
    draft.state === "closed";

  return (
    <>
      <FormContext readonly={readonly} alwaysVisible>
        <PageColumns>
          <div className="grow @lg:w-full max-w-4xl mx-auto">
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
                <InputButton
                  theme="invisible"
                  readonly={contentReadonly}
                  ctrl={ctrl("reference")}
                  label="Référence"
                  content={() => (
                    <ReferencePreferenceEditor
                      client={client}
                      draft={draft}
                      ctrl={ctrl}
                    />
                  )}
                  className="justify-start text-left"
                >
                  <Heading size="4" className="m-0">
                    {getDocumentName(draft.type)} {draft.reference}
                  </Heading>
                  {(draft.type === "invoices" ||
                    draft.type === "credit_notes") &&
                    draft.state === "draft" &&
                    ctrl("reference_preferred_value") && (
                      <ReferencePreferenceEditor
                        client={client}
                        draft={draft}
                        ctrl={ctrl}
                        readonly
                      />
                    )}
                </InputButton>

                <div className={readonly ? "flex space-x-1" : "flex space-x-1"}>
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
                        {formatfns(ctrl("emit_date").value || 0, "PPP")}
                      </Text>
                    </InputButton>
                  )}
                  {draft.type === "invoices" && (
                    <InputButton
                      theme="invisible"
                      className="m-0 whitespace-nowrap"
                      value
                      disabled
                      readonly={readonly}
                    >
                      <Text size="2" className="opacity-75" weight="medium">
                        {readonly ? " • " : ""}Paiement avant le{" "}
                        {formatdfns(
                          computePaymentDelayDate(draft).toJSDate(),
                          "PP"
                        )}
                      </Text>
                      {computePaymentDelayDate(draft).toMillis() < Date.now() &&
                        draft.state !== "closed" && (
                          <Text
                            size="2"
                            className="opacity-75 ml-2 text-red-500"
                            weight="medium"
                          >
                            (en retard de{" "}
                            {Math.abs(
                              Math.floor(
                                computePaymentDelayDate(draft)
                                  .diff(DateTime.now())
                                  .as("days")
                              )
                            )}{" "}
                            jours)
                          </Text>
                        )}
                    </InputButton>
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
                        {"• Accepté le "}
                        {formatdfns(
                          new Date(
                            ctrl("wait_for_completion_since").value ||
                              Date.now()
                          ),
                          "PP"
                        )}
                      </Text>
                    </InputButton>
                  )}
                </div>
              </Section>
              <FormContext readonly={readonly} alwaysVisible>
                {(!readonly || ctrl("name").value) && (
                  <InputButton
                    theme="invisible"
                    size="sm"
                    className="-mx-1 px-1"
                    placeholder="Désignation"
                    content={() => (
                      <div className="space-y-2 mt-4">
                        <FormInput ctrl={ctrl("name")} label="Désignation" />
                        <FormInput
                          ctrl={ctrl("alt_reference")}
                          label="Autre référence"
                        />
                      </div>
                    )}
                    value={
                      [ctrl("name").value, ctrl("alt_reference").value]
                        .filter((a) => (a || "").trim())
                        .join(" - ") || false
                    }
                  />
                )}
              </FormContext>

              {draft.type === "quotes" && draft.state === "recurring" && (
                <InputButton
                  theme="invisible"
                  className="my-2 block"
                  data-tooltip={new Date(
                    ctrl("subscription_started_at").value
                  ).toDateString()}
                  ctrl={ctrl("subscription_started_at")}
                  placeholder="Date de démarrage"
                  value={formatTime(ctrl("subscription_started_at").value || 0)}
                  content={() => (
                    <>
                      <FormInput
                        ctrl={ctrl("subscription_started_at")}
                        type="date"
                      />
                      <Info className="block my-2">
                        Modifier la date de démarrage modifiera la date de
                        récurrence. Il est possible de mettre une date de
                        démarrage dans le futur, dans ce cas aucune facture ne
                        sera générée avant cette date.
                      </Info>
                      <BaseSmall className="block my-2">
                        La prochaine facture sera générée le{" "}
                        {formatDate(
                          getInvoiceNextDate(draft) || 0,
                          "yyyy-MM-dd"
                        )}
                      </BaseSmall>
                    </>
                  )}
                  readonly={readonly}
                >
                  <Text size="2" className="opacity-75" weight="medium">
                    <PlayCircleIcon className="h-3 w-3 inline-block mr-1 -mt-0.5" />
                    {"Démarre le "}
                    {formatDate(
                      draft.subscription_started_at || 0,
                      "yyyy-MM-dd"
                    )}
                    {", prochaine facture le "}
                    {formatDate(
                      getInvoiceNextDate(draft) ||
                        draft.subscription_next_invoice_date ||
                        0,
                      "yyyy-MM-dd"
                    )}
                  </Text>
                </InputButton>
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
                      <ContactRestDocument
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
                        <ContactRestDocument
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
                    <ContactRestDocument
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
                              client={invoiceCounterParty || undefined}
                              contact={invoiceContact || undefined}
                              noResetToDefault={true}
                            />
                          </div>
                        )}

                      {!isSupplierRelated &&
                        draft.type !== "quotes" &&
                        (!!draft.content?.find((a) => a.subscription) ||
                          originQuote?.subscription) && (
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
                            client={invoiceCounterParty!}
                            contact={invoiceContact}
                          />
                        </div>
                      )}

                      <div className="mt-8">
                        <Section className="mb-2">Autre</Section>
                        <div className="m-grid-1">
                          <InvoiceInputFormat
                            btnKey="invoice-format"
                            ctrl={ctrl("format")}
                            ctrlLang={ctrl("language")}
                            readonly={readonly}
                            client={invoiceCounterParty || undefined}
                            contact={invoiceContact || undefined}
                            language={draft.language}
                          />
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
                  translations={InvoicesFieldsNames() as any}
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

export const ReferencePreferenceEditor = ({
  client,
  draft,
  ctrl,
  readonly,
}: {
  client: Clients;
  draft: Invoices;
  ctrl: any;
  readonly?: boolean;
}) => {
  const expectedNumber = getFormattedNumerotation(
    client.invoices_counters[
      new Date(draft.emit_date).getFullYear().toString()
    ][draft.type].format,
    ctrl("reference_preferred_value").value ||
      client.invoices_counters[
        new Date(draft.emit_date).getFullYear().toString()
      ][draft.type].counter,
    draft.emit_date
  );
  const { invoices: alreadyUsed } = useInvoices({
    query: buildQueryFromMap({
      reference: expectedNumber,
    }),
  });
  const isAlreadyUsed = alreadyUsed?.data?.list?.some((a) => a.id !== draft.id);

  if (readonly && draft.reference_preferred_value) {
    return (
      <Text size="2">
        Réf. à l'envoi <strong>{expectedNumber}</strong>
        {isAlreadyUsed && (
          <Tooltip content="Impossible d'utiliser cette référence">
            <ExclamationCircleIcon className="w-4 h-4 text-red-500 inline-block ml-1" />
          </Tooltip>
        )}
      </Text>
    );
  }

  return (
    <>
      <FormInput
        autoFocus
        autoSelect
        ctrl={ctrl("reference")}
        type="text"
        placeholder="Référence"
      />
      {(draft.type === "invoices" || draft.type === "credit_notes") && (
        <div className="mt-4 space-y-2">
          <Heading size="2">Numéro de facture de préférence</Heading>
          <FormInput
            autoFocus
            autoSelect
            ctrl={ctrl("reference_preferred_value")}
            type="number"
            placeholder={"Utiliser le prochain numéro disponible"}
          />
          <Text size="2" className="block">
            <strong>{expectedNumber}</strong> sera utilisé une fois le document
            envoyé (si déjà utilisé, le prochain numéro disponible sera
            utilisé).
          </Text>
          {isAlreadyUsed && (
            <Callout.Root size="1" color="red">
              Cette référence est déjà utilisé, la prochaine valeur disponible
              sera utilisé à la place.
            </Callout.Root>
          )}
        </div>
      )}
    </>
  );
};
