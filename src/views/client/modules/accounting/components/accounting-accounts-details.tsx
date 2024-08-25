import { Section } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import { FormContext } from "@components/form/formcontext";
import { RestDocumentsInput } from "@components/input-rest";
import { AccountingAccounts } from "@features/accounting/types/types";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { useEffect } from "react";

export const AccountingAccountsDetailsPage = ({
  readonly,
  id,
}: {
  readonly?: boolean;
  id: string;
}) => {
  const { isPending, ctrl, draft, setDraft } =
    useReadDraftRest<AccountingAccounts>(
      "accounting_accounts",
      id || "new",
      readonly
    );

  useEffect(() => {
    if (!readonly) setDraft({ ...draft, type: draft.type || "internal" });
  }, [draft.type]);

  if (isPending) return null;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <FormContext readonly={readonly} alwaysVisible>
        <Section>Compte comptable</Section>

        <div className="flex space-x-2">
          <FormInput
            label="Identifiant"
            type="number"
            placeholder="401"
            ctrl={ctrl("standard_identifier")}
          />

          <FormInput
            label="Nom"
            type="text"
            placeholder="Nom du compte"
            ctrl={ctrl("name")}
          />
        </div>

        <br />
        <FormInput
          label="Type de compte"
          type="select"
          ctrl={ctrl("type")}
          options={[
            {
              value: "client",
              label: "Compte client",
            },
            {
              value: "supplier",
              label: "Compte fournisseur",
            },
            {
              value: "internal",
              label: "Autre",
            },
          ]}
        />

        {draft.type !== "internal" && (
          <RestDocumentsInput
            className="mt-2"
            entity="contacts"
            label="Contact associé à ce compte"
            ctrl={ctrl("contact")}
            size="xl"
          />
        )}
      </FormContext>
    </div>
  );
};
