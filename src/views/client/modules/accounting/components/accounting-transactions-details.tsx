import { Card } from "@atoms/card";
import { Section } from "@atoms/text";
import { CustomFieldsInput } from "@components/custom-fields-input";
import { FormInput } from "@components/form/fields";
import { FormContext } from "@components/form/formcontext";
import { RestDocumentsInput } from "@components/input-rest";
import { FilesInput } from "@components/input-rest/files";
import { TagsInput } from "@components/input-rest/tags";
import { UsersInput } from "@components/input-rest/users";
import { useAccountingAccounts } from "@features/accounting/hooks/use-accounting-accounts";
import {
  AccountingAccounts,
  AccountingTransactions,
} from "@features/accounting/types/types";
import { useClients } from "@features/clients/state/use-clients";
import { useInvoice } from "@features/invoices/hooks/use-invoices";
import { currencyOptions } from "@features/utils/constants";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { ArrowRightIcon } from "@heroicons/react/16/solid";
import { EditorInput } from "@molecules/editor-input";
import { useEffect } from "react";
import { InvoiceRestDocument } from "../../invoices/components/invoice-lines-input/invoice-input-rest-card";
import { Timeline } from "@molecules/timeline";
import { ROUTES } from "@features/routes";

export const AccountingTransactionsDetailsPage = ({
  readonly,
  id,
}: {
  readonly?: boolean;
  id: string;
}) => {
  const { client: clientUser } = useClients();
  const client = clientUser!.client!;

  const { isPending, ctrl, draft, setDraft } =
    useReadDraftRest<AccountingTransactions>(
      "accounting_transactions",
      id || "new",
      readonly
    );

  useEffect(() => {
    if (!readonly) {
      setDraft((draft) => ({
        ...draft,
        transaction_date: draft.transaction_date || new Date().toISOString(),
        currency: draft.currency || client.preferences.currency || "EUR",
      }));
    }
  }, [draft.transaction_date, draft.currency]);

  const { invoice } = useInvoice(draft.rel_invoices?.[0] || "");
  const { accounting_accounts: internalAccounts } = useAccountingAccounts({
    query: {
      type: "internal",
    },
  });

  const isSupplierRelated =
    invoice?.type === "supplier_invoices" ||
    invoice?.type === "supplier_credit_notes";
  const { accounting_accounts: counterpartyAccount } = useAccountingAccounts({
    query: {
      contact: isSupplierRelated ? invoice.supplier : invoice?.client,
      type: isSupplierRelated ? "supplier" : "client",
    },
  });
  const debitForcedToId =
    invoice?.type === "invoices" || invoice?.type === "supplier_credit_notes";
  const creditForcedToId =
    invoice?.type === "supplier_invoices" || invoice?.type === "credit_notes";

  useEffect(() => {
    if (!readonly) {
      const counterpartyAccountId = counterpartyAccount?.data?.list?.[0]?.id;
      if (
        debitForcedToId &&
        draft.debit !== counterpartyAccountId &&
        counterpartyAccountId
      ) {
        setDraft((draft) => ({
          ...draft,
          debit: counterpartyAccountId || "",
          credit:
            internalAccounts?.data?.total === 1
              ? internalAccounts?.data?.list?.[0]?.id
              : "",
        }));
      }
      if (
        creditForcedToId &&
        draft.credit !== counterpartyAccountId &&
        counterpartyAccountId
      ) {
        setDraft((draft) => ({
          ...draft,
          debit:
            internalAccounts?.data?.total === 1
              ? internalAccounts?.data?.list?.[0]?.id
              : "",
          credit: counterpartyAccountId || "",
        }));
      }
    }
  }, [
    creditForcedToId,
    debitForcedToId,
    readonly,
    draft.debit,
    draft.credit,
    counterpartyAccount?.data?.list?.[0]?.id,
  ]);

  if (isPending) return null;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <FormContext readonly={readonly} alwaysVisible>
        {!readonly && (
          <Card title="Déclarer une opération">
            Déclarez ou éditez une opération comptable.
          </Card>
        )}

        <div className="float-right">
          <TagsInput ctrl={ctrl("tags")} />
          <UsersInput ctrl={ctrl("assigned")} />
        </div>
        <Section className="mb-2">Opération</Section>

        <FormInput label="Référence" type="text" ctrl={ctrl("reference")} />

        <div className="flex space-x-2 mt-2">
          <FormInput label="Date" type="date" ctrl={ctrl("transaction_date")} />
          <FormInput
            label="Montant"
            type="formatted"
            format="price"
            ctrl={ctrl("amount")}
          />
          <FormInput
            label="Devise"
            type="select"
            ctrl={ctrl("currency")}
            options={currencyOptions}
          />
        </div>

        <div className="flex space-x-2 items-center mt-4">
          <RestDocumentsInput
            disabled={
              !!counterpartyAccount?.data?.list?.[0]?.id && debitForcedToId
            }
            entity="accounting_accounts"
            size="xl"
            label="Compte à débiter"
            placeholder="Associer un compte"
            filter={
              debitForcedToId
                ? {
                    type: isSupplierRelated ? "supplier" : "client",
                  }
                : ({
                    type: "internal",
                  } as Partial<AccountingAccounts>)
            }
            ctrl={ctrl("debit")}
          />
          <ArrowRightIcon className="w-4 h-4 shrink-0" />
          <RestDocumentsInput
            disabled={
              !!counterpartyAccount?.data?.list?.[0]?.id && creditForcedToId
            }
            entity="accounting_accounts"
            size="xl"
            label="Compte à créditer"
            placeholder="Associer un compte"
            filter={
              creditForcedToId
                ? {
                    type: isSupplierRelated ? "supplier" : "client",
                  }
                : ({
                    type: "internal",
                  } as Partial<AccountingAccounts>)
            }
            ctrl={ctrl("credit")}
          />
        </div>

        <Section className="mb-2 mt-8">Factures / avoirs liés</Section>
        <InvoiceRestDocument
          ctrl={ctrl("rel_invoices")}
          label="Documents liés"
          placeholder="Aucun document lié"
          size="xl"
          max={10}
          filter={{
            type: [
              "invoices",
              "credit_notes",
              "supplier_invoices",
              "supplier_credit_notes",
            ] as any,
            state: ["sent"] as any,
          }}
        />

        <CustomFieldsInput
          className="mt-8"
          table={"accounting_transactions"}
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
                readonly ? "Aucune note" : "Cliquez pour ajouter des notes"
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
                  table: "accounting_transactions",
                  id: draft.id || "",
                  field: "documents",
                }}
              />
            )}
          </div>
        </div>

        <div className="mt-8">
          <Timeline
            entity="accounting_transactions"
            id={draft.id}
            viewRoute={ROUTES.AccountingView}
          />
        </div>
      </FormContext>
    </div>
  );
};
