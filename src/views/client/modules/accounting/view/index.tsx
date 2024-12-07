import { PageLoader } from "@atoms/page-loader";
import { DocumentBar } from "@components/document-bar";
import { ROUTES, getRoute } from "@features/routes";
import { useAccountingTransaction } from "@features/accounting/hooks/use-accounting-transactions";
import { Page } from "@views/client/_layout/page";
import { useParams } from "react-router-dom";
import { AccountingTransactionsDetailsPage } from "../components/accounting-transactions-details";

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
          editRoute={ROUTES.AccountingEdit}
          viewRoute={ROUTES.AccountingView}
          prefix={<></>}
          suffix={<></>}
          onRemove={
            item?.id ? async () => remove.mutateAsync(item?.id) : undefined
          }
          onRestore={
            item?.id ? async () => restore.mutateAsync(item?.id) : undefined
          }
        />
      }
    >
      <AccountingTransactionsDetailsPage readonly={true} id={id || ""} />
    </Page>
  );
};
