import { SectionSmall } from "@atoms/text";
import { AccountingAccountInput } from "@components/accounting-account-input";
import { RestDocumentsInput } from "@components/input-rest";
import { buildQueryFromMap } from "@components/search-bar/utils/utils";
import { useAccountingAccounts } from "@features/accounting/hooks/use-accounting-accounts";

export const ContactAccountingAccount = (props: {
  type: "client" | "supplier";
  contactId: string;
  readonly?: boolean;
}) => {
  const { accounting_accounts: accounts } = useAccountingAccounts({
    query: buildQueryFromMap({
      contact: props.contactId,
      type: props.type,
    }),
  });

  const label =
    props.type === "client" ? "Compte client" : "Compte fournisseur";

  return (
    <div>
      <SectionSmall>{label}</SectionSmall>
      {accounts.data?.list?.map((account) => (
        <AccountingAccountInput
          placeholder={label}
          value={account}
          onChange={() => {}}
          readonly={props.readonly}
        />
      ))}
      {accounts.data?.list?.length === 0 && (
        <RestDocumentsInput
          entity="accounting_accounts"
          size="xl"
          label={
            props.type === "client" ? "Compte client" : "Compte fournisseur"
          }
          placeholder={
            props.type === "client"
              ? "Associer un compte client"
              : "Associer un compte fournisseur"
          }
        />
      )}
    </div>
  );
};
