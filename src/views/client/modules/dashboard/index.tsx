import { Page } from "@views/client/_layout/page";
import LineChart from "./components/line-chart";
import DashboardCard from "./components/card";
import AccountingCard from "./components/accounting-card";
import NumberCard from "./components/number-card";
import { useStatistics } from "@features/statistics/hooks";
import { useParams } from "react-router-dom";
import {
  ArrowTurnRightDownIcon,
  ArrowTurnRightUpIcon,
  AtSymbolIcon,
  BanknotesIcon,
  ClipboardIcon,
} from "@heroicons/react/24/outline";
import TableCard from "./components/table-card";

export const DashboardHomePage = () => {
  const { client: clientId } = useParams();
  const statistics = useStatistics(clientId);

  return (
    <Page
      title={[
        {
          label: "Tableau de bord",
        },
      ]}
    >
      <div className="flex lg:h-full flex-col lg:flex-row">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px_1fr_250px] lg:grid-rows-[calc(50%-5px)_calc(50%-5px)] w-full lg:w-2/3 lg:h-full gap-[10px] mr-[10px]">
          <div className="w-full min-h-128 lg:h-full lg:col-span-3">
            <LineChart />
          </div>
          <AccountingCard className={"min-h-64"}></AccountingCard>
          <TableCard
            title="Paiements bientôt en retard"
            items={[]}
            className="lg:col-span-2"
            columns={[
              { label: "Livraison le", value: "delivery" },
              { label: "Devis", value: "quote" },
              { label: "Montant", value: "quote" },
            ]}
          />
          <DashboardCard
            title="Paiements bientôt en retard"
            className="lg:col-span-2"
          ></DashboardCard>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 flex-grow gap-[10px]">
          <NumberCard
            title="Devis signés"
            number={statistics.signedQuotes ?? 0}
            totalNumber={434}
            icon={(props) => <ClipboardIcon {...props} />}
          />
          <NumberCard
            title="Devis envoyés"
            number={statistics.sentQuotes ?? 0}
            totalNumber={434}
            icon={(props) => <AtSymbolIcon {...props} />}
          />
          <NumberCard
            title="Factures payées"
            number={statistics.paidInvoices ?? 0}
            totalNumber={434}
            icon={(props) => <BanknotesIcon {...props} />}
          />
          <NumberCard
            title="Factures envoyées"
            number={statistics.sentInvoices ?? 0}
            totalNumber={434}
            icon={(props) => <AtSymbolIcon {...props} />}
          />
          <NumberCard
            title="Entrées stock"
            number={statistics.stockEntries ?? 0}
            totalNumber={434}
            icon={(props) => <ArrowTurnRightDownIcon {...props} />}
          />
          <NumberCard
            title="Sorties stock"
            number={statistics.stockExits ?? 0}
            totalNumber={434}
            icon={(props) => <ArrowTurnRightUpIcon {...props} />}
          />
          <NumberCard
            title="Commandes envoyées"
            className="lg:col-span-2"
            number={statistics.sentPurchaseOrders ?? 0}
            totalNumber={434}
            icon={(props) => <AtSymbolIcon {...props} />}
          />
        </div>
      </div>
    </Page>
  );
};
