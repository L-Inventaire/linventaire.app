import { Button } from "@atoms/button/button";
import { ButtonConfirm } from "@atoms/button/confirm";
import { InputLabel } from "@atoms/input/input-decoration-label";
import { Modal, ModalContent } from "@atoms/modal/modal";
import { Info, Section } from "@atoms/text";
import { FormInput } from "@components/form/fields";
import { useFormController } from "@components/form/formcontext";
import { PCGInput } from "@components/pcg-input";
import { useHasAccess } from "@features/access";
import { AccountingAccountsColumns } from "@features/accounting/configuration";
import { useAccountingAccounts } from "@features/accounting/hooks/use-accounting-accounts";
import { AccountingAccounts } from "@features/accounting/types/types";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { EditorInput } from "@molecules/editor-input";
import { Table } from "@molecules/table";
import _ from "lodash";
import { useState } from "react";
import { Page, PageBlock } from "../../_layout/page";

export const BankAccountsPage = () => {
  const { accounting_accounts, remove, upsert } = useAccountingAccounts({
    query: {
      type: "internal",
    },
  });
  const [edit, setEdit] = useState<Partial<AccountingAccounts> | null>(null);
  const { ctrl } = useFormController(edit || {}, setEdit);
  const hasAccess = useHasAccess();

  return (
    <Page title={[{ label: "Paramètres" }, { label: "Comptes" }]}>
      <PageBlock>
        {hasAccess("STOCK_MANAGE") && (
          <Button
            size="md"
            className="float-right"
            onClick={() =>
              setEdit({
                standard_identifier: "411",
              })
            }
            shortcut={["shift+a"]}
          >
            Ajouter
          </Button>
        )}
        <Modal open={!!edit} onClose={() => setEdit(null)}>
          {!!edit && (
            <ModalContent
              title={edit?.id ? "Modifier une compte" : "Ajouter une compte"}
            >
              <div className="space-y-4">
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
                <Button
                  disabled={!ctrl("name").value || !ctrl("type").value}
                  shortcut={["enter"]}
                  onClick={async () => {
                    await upsert.mutate({
                      ...(edit || {}),
                      standard: "pcg",
                      type: "internal",
                      contact: "",
                    });
                    setEdit(null);
                  }}
                >
                  Enregistrer
                </Button>
              </div>
            </ModalContent>
          )}
        </Modal>

        <Section>Comptes</Section>
        <Info>
          Définissez les comptes bancaires ou de caisse de votre entreprise.
        </Info>

        <Table
          className="mt-4"
          data={_.sortBy(accounting_accounts.data?.list || [], "name")}
          columns={[
            ...AccountingAccountsColumns,
            {
              hidden: !hasAccess("ACCOUNTING_MANAGE"),
              title: "Actions",
              thClassName: "w-1 whitespace-nowrap",
              render: (stockLocation) => {
                return (
                  <div className="text-right space-x-2 whitespace-nowrap flex items-center">
                    <Button
                      theme="outlined"
                      size="md"
                      onClick={() => setEdit(stockLocation)}
                      icon={(p) => <PencilIcon {...p} />}
                    />
                    <ButtonConfirm
                      theme="danger"
                      size="md"
                      onClick={() => remove.mutate(stockLocation.id)}
                      icon={(p) => <TrashIcon {...p} />}
                    />
                  </div>
                );
              },
            },
          ]}
        />
      </PageBlock>
    </Page>
  );
};
