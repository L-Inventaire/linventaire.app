import { Button } from "@atoms/button/button";
import { SectionSmall } from "@atoms/text";
import { RestDocumentsInput } from "@components/input-rest";
import { buildQueryFromMap } from "@components/search-bar/utils/utils";
import { useAccountingAccounts } from "@features/accounting/hooks/use-accounting-accounts";

export const ContactAccountingAccount = (props: {
  type: "client" | "supplier";
  contactId: string;
}) => {
  const { accounting_accounts: accounts } = useAccountingAccounts({
    query: buildQueryFromMap({
      contact: props.contactId,
      type: props.type,
    }),
  });

  return (
    <div>
      <SectionSmall>
        {props.type === "client" ? "Compte client" : "Compte fournisseur"}
      </SectionSmall>
      {accounts.data?.list?.map((account) => (
        <Button key={account.id} theme="outlined" className="my-1">
          <b>{account.standard_identifier}</b> <span>{account.name}</span>
        </Button>
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
