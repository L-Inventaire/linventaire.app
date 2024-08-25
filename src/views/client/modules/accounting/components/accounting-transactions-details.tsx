import { Card } from "@atoms/card";
import { Section } from "@atoms/text";
import { CustomFieldsInput } from "@components/custom-fields-input";
import { FormInput } from "@components/form/fields";
import { FormContext } from "@components/form/formcontext";
import { FilesInput } from "@components/input-rest/files";
import { TagsInput } from "@components/input-rest/tags";
import { UsersInput } from "@components/input-rest/users";
import { AccountingTransactions } from "@features/accounting/types/types";
import { useClients } from "@features/clients/state/use-clients";
import { currencyOptions } from "@features/utils/constants";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { EditorInput } from "@molecules/editor-input";
import { InvoiceRestDocument } from "../../invoices/components/invoice-lines-input/invoice-input-rest-card";
import {
  ArrowRightCircleIcon,
  ArrowRightIcon,
} from "@heroicons/react/16/solid";

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

  return (
    <div className="w-full max-w-3xl mx-auto">
      <FormContext readonly={readonly} alwaysVisible>
        <Card title="Déclarer une opération">
          Déclarez ou éditez une opération bancaire.
        </Card>

        <div className="float-right">
          <TagsInput ctrl={ctrl("tags")} />
          <UsersInput ctrl={ctrl("assigned")} />
        </div>
        <Section className="mb-2">Opération</Section>

        <div className="flex space-x-2">
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
          <FormInput
            label="Compte à débiter"
            type="select"
            ctrl={ctrl("debit")}
            disabled
            options={currencyOptions}
          />
          <ArrowRightIcon className="w-4 h-4 shrink-0 mt-6" />
          <FormInput
            label="Compte à créditer"
            type="select"
            ctrl={ctrl("credit")}
            disabled
            options={currencyOptions}
          />
        </div>

        <Section className="mb-2 mt-8">Factures / avoirs liés</Section>
        <InvoiceRestDocument
          ctrl={ctrl("rel_invoices")}
          label="Facture liée"
          size="xl"
          max={1}
          filter={{
            type: [
              "invoices",
              "credit_notes",
              "supplier_invoices",
              "supplier_credit_notes",
            ] as any,
            state: ["partial_paid", "sent", "accounted"] as any,
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
      </FormContext>
    </div>
  );
};
