import { Button } from "@atoms/button/button";
import { Info } from "@atoms/text";
import { RestTable } from "@components/table-rest";
import { AccountingTransactionsColumns } from "@features/accounting/configuration";
import { useAccountingTransactions } from "@features/accounting/hooks/use-accounting-transactions";
import { AccountingTransactions } from "@features/accounting/types/types";
import { ROUTES, getRoute } from "@features/routes";
import { useNavigateAlt } from "@features/utils/navigate";
import {
  RestOptions,
  useRestSchema,
} from "@features/utils/rest/hooks/use-rest";
import { PlusIcon } from "@heroicons/react/16/solid";
import { Page } from "@views/client/_layout/page";
import { useState } from "react";
import { SearchBar } from "../../../../components/search-bar";
import { schemaToSearchFields } from "../../../../components/search-bar/utils/utils";
import { format } from "date-fns";
import { useHasAccess } from "@features/access";

export const AccountingPage = () => {
  const [options, setOptions] = useState<RestOptions<AccountingTransactions>>({
    limit: 20,
    offset: 0,
    query: [],
    index: "transaction_date",
    asc: false,
  });
  const { accounting_transactions } = useAccountingTransactions({
    ...options,
    query: [...((options?.query as any) || [])],
  });

  const schema = useRestSchema("accounting_transactions");
  const navigate = useNavigateAlt();
  const hasAccess = useHasAccess();

  return (
    <Page
      title={[{ label: "Accounting" }]}
      bar={
        <SearchBar
          schema={{
            table: "accounting_transactions",
            fields: schemaToSearchFields(schema.data, {}),
          }}
          onChange={(q) =>
            q.valid && setOptions({ ...options, query: q.fields })
          }
          suffix={
            <>
              {hasAccess("ACCOUNTING_WRITE") && (
                <Button
                  size="sm"
                  onClick={() =>
                    navigate(getRoute(ROUTES.AccountingEdit, { id: "new" }))
                  }
                  icon={(p) => <PlusIcon {...p} />}
                  hideTextOnMobile
                >
                  Ajouter
                </Button>
              )}
            </>
          }
        />
      }
    >
      <div className="-m-3 overflow-auto max-w-[100vw]">
        <div className="px-3 h-7 w-full bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
          <Info>
            {accounting_transactions?.data?.total || 0} documents trouvés
          </Info>
        </div>
        <RestTable
          groupBy={(row) => format(new Date(row.transaction_date), "yyyy-MM")}
          groupByRender={(row) =>
            format(new Date(row.transaction_date), "LLLL yyyy")
          }
          entity="accounting_transactions"
          onClick={({ id }, event) =>
            navigate(getRoute(ROUTES.AccountingView, { id }), { event })
          }
          data={accounting_transactions}
          showPagination="full"
          onRequestData={async (page) => {
            setOptions({
              ...options,
              limit: page.perPage,
              offset: (page.page - 1) * page.perPage,
            });
          }}
          columns={AccountingTransactionsColumns()}
        />
      </div>
    </Page>
  );
};
