import { PageLoader } from "@atoms/page-loader";
import { DocumentBar } from "@components/document-bar";
import { useHasAccess } from "@features/access";
import { useAccountingTransaction } from "@features/accounting/hooks/use-accounting-transactions";
import { useParamsOrContextId } from "@features/ctrlk";
import { ROUTES, getRoute } from "@features/routes";
import { Page } from "@views/client/_layout/page";
import { AccountingTransactionsDetailsPage } from "../components/accounting-transactions-details";

export const AccountingTransactionsViewPage = (_props: {
  readonly?: boolean;
}) => {
  const { id } = useParamsOrContextId();
  const {
    accounting_transaction: item,
    restore,
    remove,
    isPending,
    isPendingModification,
  } = useAccountingTransaction(id || "");
  const hasAccess = useHasAccess();

  if (!item)
    return (
      <div className="flex justify-center items-center h-full w-full dark:bg-slate-990 bg-white">
        <PageLoader />
      </div>
    );

  return (
    <Page
      loading={isPendingModification}
      title={[
        {
          label: "AccountingTransactions",
          to: getRoute(ROUTES.Accounting),
        },
        { label: item.reference || "" },
      ]}
      bar={
        <DocumentBar
          loading={isPending && !item}
          entity={"accounting_transactions"}
          document={item || { id }}
          mode={"read"}
          onRemove={
            item?.id && hasAccess("ACCOUNTING_WRITE")
              ? async () => remove.mutateAsync(item?.id)
              : undefined
          }
          onRestore={
            item?.id && hasAccess("ACCOUNTING_WRITE")
              ? async () => restore.mutateAsync(item?.id)
              : undefined
          }
        />
      }
    >
      <AccountingTransactionsDetailsPage readonly={true} id={id || ""} />
    </Page>
  );
};
