import { PageLoader } from "@atoms/page-loader";
import { DocumentBar } from "@components/document-bar";
import { useClients } from "@features/clients/state/use-clients";
import { ROUTES, getRoute } from "@features/routes";
import { useAccountingTransactionDefaultModel } from "@features/accounting/configuration";
import { AccountingTransactions } from "@features/accounting/types/types";
import { useDraftRest } from "@features/utils/rest/hooks/use-draft-rest";
import { Page } from "@views/client/_layout/page";
import _ from "lodash";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AccountingTransactionsDetailsPage } from "../components/accounting-transactions-details";

export const AccountingTransactionsEditPage = (_props: {
  readonly?: boolean;
}) => {
  const { refresh, loading } = useClients();

  useEffect(() => {
    refresh();
  }, []);

  let { id } = useParams();
  id = id === "new" ? "" : id || "";
  const navigate = useNavigate();

  const defaultModel = useAccountingTransactionDefaultModel();
  const initialModel = JSON.parse(
    new URLSearchParams(window.location.search).get("model") || "{}"
  ) as AccountingTransactions;

  const { isInitiating, save, draft } = useDraftRest<AccountingTransactions>(
    "accounting_transactions",
    id || "new",
    async (item) => {
      navigate(getRoute(ROUTES.AccountingView, { id: item.id }));
    },
    _.omit(
      _.merge(defaultModel, initialModel),
      "reference"
    ) as AccountingTransactions
  );

  return (
    <Page
      title={[
        { label: "Accounting", to: getRoute(ROUTES.Accounting) },
        { label: id ? "Modifier" : "Créer" },
      ]}
      bar={
        <DocumentBar
          loading={isInitiating || loading}
          entity={"accounting_transactions"}
          document={{ id }}
          mode={"write"}
          onSave={async () => await save()}
          backRoute={ROUTES.Accounting}
          viewRoute={ROUTES.AccountingView}
          editRoute={ROUTES.AccountingEdit}
        />
      }
    >
      {isInitiating ? (
        <PageLoader />
      ) : (
        <AccountingTransactionsDetailsPage readonly={false} id={id} />
      )}
    </Page>
  );
};
