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
  const { accounting_transaction: item, isPending } = useAccountingTransaction(
    id || ""
  );

  if (!item)
    return (
      <div className="flex justify-center items-center h-full w-full dark:bg-wood-990 bg-white">
        <PageLoader />
      </div>
    );

  return (
    <Page
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
          prefix={<></>}
          suffix={<></>}
        />
      }
    >
      <AccountingTransactionsDetailsPage readonly={true} id={id || ""} />
    </Page>
  );
};
