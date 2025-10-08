import { Button } from "@atoms/button/button";
import { ButtonConfirm } from "@atoms/button/confirm";
import { Info } from "@atoms/text";
import { useHasAccess } from "@features/access";
import { AccountingAccountsColumns } from "@features/accounting/configuration";
import { useAccountingAccounts } from "@features/accounting/hooks/use-accounting-accounts";
import { useEditFromCtrlK } from "@features/ctrlk/use-edit-from-ctrlk";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Table } from "@molecules/table";
import { Heading } from "@radix-ui/themes";
import _ from "lodash";
import { Page } from "../../_layout/page";

export const BankAccountsPage = () => {
  const { accounting_accounts, remove } = useAccountingAccounts({
    query: {
      type: "internal",
    },
  });
  const hasAccess = useHasAccess();

  const edit = useEditFromCtrlK();

  return (
    <Page title={[{ label: "Paramètres" }, { label: "Comptes" }]}>
      <div className="w-full max-w-4xl mx-auto mt-6">
        {hasAccess("ACCOUNTING_MANAGE") && (
          <Button
            size="md"
            className="float-right"
            onClick={() =>
              edit("accounting_accounts", undefined, {
                standard_identifier: "512",
              })
            }
            shortcut={["shift+a"]}
          >
            Ajouter
          </Button>
        )}

        <Heading size="6">Comptes</Heading>
        <Info>
          Définissez les comptes bancaires ou de caisse de votre entreprise.
        </Info>

        <Table
          border
          className="mt-4"
          data={_.sortBy(accounting_accounts.data?.list || [], "name")}
          columns={[
            ...AccountingAccountsColumns,
            {
              hidden: !hasAccess("ACCOUNTING_MANAGE"),
              title: "Actions",
              thClassName: "w-1 whitespace-nowrap",
              render: (accountingAccount) => {
                return (
                  <div className="text-right space-x-2 whitespace-nowrap flex items-center">
                    <Button
                      theme="outlined"
                      size="md"
                      onClick={() =>
                        edit("accounting_accounts", accountingAccount.id)
                      }
                      icon={(p) => <PencilIcon {...p} />}
                    />
                    <ButtonConfirm
                      theme="danger"
                      size="md"
                      onClick={() => remove.mutate(accountingAccount.id)}
                      icon={(p) => <TrashIcon {...p} />}
                    />
                  </div>
                );
              },
            },
          ]}
        />
      </div>
    </Page>
  );
};
