import { InputLabel } from "@atoms/input/input-decoration-label";
import { FormInput } from "@components/form/fields";
import { FormContext } from "@components/form/formcontext";
import { PCGInput } from "@components/pcg-input";
import { AccountingAccounts } from "@features/accounting/types/types";
import { ROUTES } from "@features/routes";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { EditorInput } from "@molecules/editor-input";
import { Timeline } from "@molecules/timeline";
import { Heading } from "@radix-ui/themes";
import { useEffect } from "react";

export const AccountingAccountDetailsPage = ({
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
    if (!readonly) {
      setDraft((draft) => ({
        ...draft,
      }));
    }
  }, [draft.name, draft.notes, draft.standard_identifier]);

  if (isPending) return null;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <FormContext readonly={readonly} alwaysVisible>
        <div className="space-y-6">
          <Heading size="4">Compte comptable {ctrl("name").value}</Heading>
          <InputLabel
            label="Type de compte"
            input={
              <PCGInput
                className="w-full flex justify-start"
                value={ctrl("standard_identifier").value}
                onChange={ctrl("standard_identifier").onChange}
              />
            }
          />
          <FormInput label="Name" ctrl={ctrl("name")} autoFocus />
          <InputLabel
            label="Notes"
            input={
              <EditorInput
                value={ctrl("notes").value}
                onChange={ctrl("notes").onChange}
              />
            }
          />
          <Timeline
            entity="accounting_accounts"
            id={id}
            viewRoute={ROUTES.AccountingView}
          />
        </div>
      </FormContext>
    </div>
  );
};
