import { PageLoader } from "@atoms/page-loader";
import { DocumentBar } from "@components/document-bar";
import { ROUTES, getRoute } from "@features/routes";
import { useAccountingTransaction } from "@features/accounting/hooks/use-accounting-transactions";
import { Page } from "@views/client/_layout/page";
import { useParams } from "react-router-dom";
import { AccountingTransactionsDetailsPage } from "../components/accounting-transactions-details";
import { useHasAccess } from "@features/access";

export const AccountingTransactionsViewPage = (_props: {
  readonly?: boolean;
}) => {
  const { id } = useParams();
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
          backRoute={ROUTES.Accounting}
          editRoute={
            hasAccess("ACCOUNTING_WRITE") ? ROUTES.AccountingEdit : undefined
          }
          viewRoute={ROUTES.AccountingView}
          prefix={<></>}
          suffix={<></>}
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
