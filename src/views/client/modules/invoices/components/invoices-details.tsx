import { Button } from "@atoms/button/button";
import { PageLoader } from "@atoms/page-loader";
import { Section } from "@atoms/text";
import { CustomFieldsInput } from "@components/custom-fields-input";
import { FormInput } from "@components/form/fields";
import { FormContext } from "@components/form/formcontext";
import { InputButton } from "@components/input-button";
import { RestDocumentsInput } from "@components/input-rest";
import { FilesInput } from "@components/input-rest/files";
import { TagsInput } from "@components/input-rest/tags";
import { UsersInput } from "@components/input-rest/users";
import { buildQueryFromMap } from "@components/search-bar/utils/utils";
import { useAccountingTransactions } from "@features/accounting/hooks/use-accounting-transactions";
import { useClients } from "@features/clients/state/use-clients";
import { useContact } from "@features/contacts/hooks/use-contacts";
import { Contacts } from "@features/contacts/types/types";
import { CtrlKRestEntities } from "@features/ctrlk";
import { useEditFromCtrlK } from "@features/ctrlk/use-edit-from-ctrlk";
import { Invoices } from "@features/invoices/types/types";
import { getDocumentName } from "@features/invoices/utils";
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
import { Table } from "@molecules/table";
import { PageColumns } from "@views/client/_layout/page";
import _ from "lodash";
import { Fragment, useEffect } from "react";
import { twMerge } from "tailwind-merge";
import { computePricesFromInvoice } from "../utils";
import { InputDelivery } from "./input-delivery";
import { InvoiceInputFormat } from "./input-format";
import { InvoicePaymentInput } from "./input-payment";
import { InvoiceRecurrenceInput } from "./input-recurrence";
import { InvoiceReminderInput } from "./input-reminder";
import { InvoiceLinesInput } from "./invoice-lines-input";
import { CompletionTags } from "./invoice-lines-input/components/completion-tags";
import { InvoiceRestDocument } from "./invoice-lines-input/invoice-input-rest-card";
import { InvoiceStatus } from "./invoice-status";
import { InvoicesPreview } from "./invoices-preview/invoices-preview";
import { RelatedInvoices } from "./related-invoices";
import { AccountingTransactions } from "@features/accounting/types/types";

export const computeCompletion = (
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

export const renderCompletion = (
  lines: Invoices["content"],
  type: "delivered" | "ready" = "ready",
  overflow = false
): [number, string] => {
  const value = computeCompletion(lines, type, overflow);
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

  const hasPreview =
    document.location.origin.includes("localhost") &&
    hasClientOrSupplier &&
    !isSupplierInvoice &&
    !isSupplierQuote;

  useEffect(() => {
    if (!isPending && draft)
      setDraft((draft: Invoices) => {
        draft = _.cloneDeep(draft);
        if (!draft.emit_date) draft.emit_date = new Date();
        if (draft.type && !draft.reference) {
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

  if (isPending || (id && draft.id !== id) || !client) return <PageLoader />;

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
        complete: !_.isEqual(
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
        complete: draft.payment_information?.mode?.length,
      },
      {
        component: (
          <InputDelivery
            btnKey="invoice-delivery"
            invoice={draft}
            ctrl={ctrl}
            readonly={readonly}
            contact={contact}
          />
        ),
        visible: !isSupplierRelated,
        complete: draft.delivery_date || draft.delivery_address,
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
        complete: draft.reminders?.enabled,
      },
      {
        component: (
          <InvoiceRecurrenceInput
            btnKey="invoice-recurrence"
            invoice={draft}
            ctrl={ctrl}
            readonly={readonly}
          />
        ),
        visible: !isSupplierRelated && draft.type !== "credit_notes",
        complete: draft.subscription?.enabled,
      },
    ].filter((a) => a.visible && (a.complete || !readonly)),
    (a) => {
      return a.complete ? -1 : 0;
    }
  );

  return (
    <>
      <FormContext readonly={readonly} alwaysVisible>
        <PageColumns>
          <div className="grow" />
          <div className="grow lg:w-3/5 max-w-3xl pt-6">
            <div className="float-right mb-2">
              <InvoiceStatus
                readonly={readonly}
                size="lg"
                value={draft.state}
                type={draft.type}
                onChange={(value) => setDraft({ ...draft, state: value })}
              />
            </div>
            <Section>
              {getDocumentName(draft.type) +
                " " +
                ctrl("reference").value +
                (ctrl("name").value ? ` (${ctrl("name").value})` : "")}
              <div className="inline-block ml-2">
                <CompletionTags
                  size="sm"
                  invoice={draft}
                  lines={draft.content}
                />
              </div>
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
                    {(!readonly || ctrl("contact").value) && (
                      <RestDocumentsInput
                        entity="contacts"
                        filter={
                          { parents: ctrl("client").value } as Partial<Contacts>
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
                  />
                )}
              </PageColumns>
              {hasClientOrSupplier && (
                <>
                  <PageColumns>
                    {(!readonly || ctrl("emit_date").value) && (
                      <InputButton
                        data-tooltip={new Date(
                          ctrl("emit_date").value
                        ).toDateString()}
                        ctrl={ctrl("emit_date")}
                        placeholder="Date d'emission"
                        value={formatTime(ctrl("emit_date").value || 0)}
                        content={
                          <FormInput ctrl={ctrl("emit_date")} type="date" />
                        }
                      >
                        {"Émis le "}
                        {formatTime(ctrl("emit_date").value || 0, {
                          hideTime: true,
                        })}
                      </InputButton>
                    )}
                    {(!readonly || ctrl("name").value) && (
                      <InputButton
                        ctrl={ctrl("name")}
                        placeholder="Titre interne"
                        icon={(p) => <DocumentTextIcon {...p} />}
                      />
                    )}
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

                {!!otherInputs.length && (
                  <div className="mt-8">
                    <Section className="mb-2">Autre</Section>
                    <div className="m-grid-1">
                      {otherInputs.map((a, i) => (
                        <Fragment key={i}>
                          {i !== 0 &&
                            !a.complete &&
                            !!otherInputs[i - 1].complete && <br />}
                          {a.component}
                        </Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {!isQuoteRelated && readonly && (
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
                                amount: draft.total?.total_with_taxes || 0,
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
                      columns={
                        CtrlKRestEntities["accounting_transactions"]
                          .renderResult as any
                      }
                    />
                  </div>
                )}

                {!readonly && !isQuoteRelated && (
                  <div className="mt-8">
                    <Section className="mb-2">Origine</Section>
                    <InvoiceRestDocument
                      label="Devis d'origine"
                      ctrl={ctrl("from_rel_quote")}
                      filter={{ type: "quotes" } as Partial<Invoices>}
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
                    onPartialInvoice={() => {}}
                  />
                )}

                <CustomFieldsInput
                  className="mt-8"
                  table={"invoices"}
                  ctrl={ctrl("fields")}
                  readonly={readonly}
                  entityId={draft.id || ""}
                />

                <div className="mt-8">
                  <Section className="mb-2">Notes et documents</Section>
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
                {false && (
                  <div className="mt-8">
                    <Section className="mb-2">Discussion</Section>
                    <div className="space-y-2 mt-2">TODO</div>
                  </div>
                )}
              </>
            )}
          </div>
          {/* TODO Clearly this fixed isn't right for all screens, we should use js probably ? */}
          {false && (
            <div
              className={twMerge(
                "lg:w-2/5 shrink-0 flex items-start justify-center pt-6 transition-all 2xl:flex hidden",
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
          )}
          <div className="grow" />
        </PageColumns>
      </FormContext>
    </>
  );
};
