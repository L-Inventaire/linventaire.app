import { FormContext } from "@components/form/formcontext";
import { AccountingAccounts } from "@features/accounting/types/types";
import { useClients } from "@features/clients/state/use-clients";
import { useReadDraftRest } from "@features/utils/rest/hooks/use-draft-rest";

export const AccountingAccountsDetailsPage = ({
  readonly,
  id,
}: {
  readonly?: boolean;
  id: string;
}) => {
  const { client: clientUser } = useClients();
  const client = clientUser!.client!;

  const { isPending, ctrl, draft, setDraft } =
    useReadDraftRest<AccountingAccounts>(
      "accounting_accounts",
      id || "new",
      readonly
    );

  return (
    <div className="w-full max-w-3xl mx-auto">
      <FormContext readonly={readonly} alwaysVisible>
        TODO
      </FormContext>
    </div>
  );
};
