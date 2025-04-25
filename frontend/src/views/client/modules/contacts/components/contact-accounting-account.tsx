import { Info, SectionSmall } from "@atoms/text";
import { pgcLabel } from "@components/pcg-input";
import { buildQueryFromMap } from "@components/search-bar/utils/utils";
import { useHasAccess } from "@features/access";
import { useAccountingAccounts } from "@features/accounting/hooks/use-accounting-accounts";
import { useEditFromCtrlK } from "@features/ctrlk/use-edit-from-ctrlk";
import { PencilIcon } from "@heroicons/react/16/solid";
import { Box, IconButton } from "@radix-ui/themes";

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

  const hasAccess = useHasAccess();
  const edit = useEditFromCtrlK();

  return (
    <div>
      <SectionSmall>{label}</SectionSmall>
      {accounts.data?.list?.map((account) => (
        <Box className="flex flex-row space-x-2 items-center py-2">
          <span>
            <b>{account.standard_identifier}</b>{" "}
            {account.name ||
              pgcLabel(account?.standard_identifier || "", false)}
          </span>
          {hasAccess("ACCOUNTING_WRITE") && (
            <IconButton
              variant="ghost"
              size="1"
              data-tooltip="Modifier le compte comptable"
            >
              <PencilIcon
                className="w-3 h-3"
                onClick={() => edit("accounting_accounts", account.id)}
              />
            </IconButton>
          )}{" "}
        </Box>
      ))}
      {accounts.data?.list?.length === 0 && (
        <Info>Un compte comptable sera créé après sauvegarde.</Info>
      )}
    </div>
  );
};
