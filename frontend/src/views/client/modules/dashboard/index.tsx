import { Title } from "@atoms/text";
import { useDashboard } from "@features/statistics/hooks";
import { Dashboard } from "@features/statistics/types";
import {
  DocumentArrowDownIcon,
  DocumentCheckIcon,
  ShoppingCartIcon,
} from "@heroicons/react/16/solid";
import { DocumentIcon } from "@heroicons/react/24/outline";
import { ClockIcon, PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { Select } from "@radix-ui/themes";
import { Page } from "@views/client/_layout/page";
import { useState } from "react";
import AccountingCard from "./components/accounting-card";
import MainChart from "./components/main-chart";
import NumberCard from "./components/number-card";

export const DashboardHomePage = () => {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const statistics = useDashboard(year);

  if (!statistics?.counters) return null;

  const reducer = (list: Dashboard["all"], type: string, states: string[]) =>
    (list || [])
      .filter((a) => a.type === type && states.includes(a.state))
      .reduce((acc, item) => acc + (parseFloat(item.count) ?? 0), 0);

  return (
    <Page
      title={[
        {
          label: "Tableau de bord",
        },
      ]}
      // scrollAreaProps={{ style: { height: "100vh" } }}
      scrollAreaChildProps={{ style: { height: "80vh" } }}
    >
      <div className="flex items-center mb-6 ml-3 mt-3">
        <Title>Tableau de bord</Title>
        <div className="grow" />
        <Select.Root
          value={year.toString()}
          onValueChange={(value) => setYear(parseInt(value))}
        >
          <Select.Trigger className="">Exercice {year}</Select.Trigger>
          <Select.Content>
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - i;
              return (
                <Select.Item key={year} value={year.toString()}>
                  {year}
                </Select.Item>
              );
            })}
          </Select.Content>
        </Select.Root>
      </div>
      <div className="flex flex-col lg:flex-row px-3 w-full gap-2">
        <div className="grow min-h-64 lg:h-full lg:col-span-3 space-y-2">
          <AccountingCard year={year}></AccountingCard>
          <MainChart year={year} />
        </div>
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            <NumberCard
              title="Devis signés"
              number={reducer(statistics?.all, "quotes", ["purchase_order"])}
              totalNumber={reducer(statistics?.all, "quotes", ["sent"])}
              icon={(props) => <DocumentIcon {...props} />}
            />
            <NumberCard
              title="Devis envoyés"
              number={reducer(statistics?.all, "quotes", ["sent"])}
              icon={(props) => <PaperAirplaneIcon {...props} />}
            />
            <NumberCard
              title="Factures payées"
              number={reducer(statistics?.all, "invoices", [
                "completed",
                "closed",
              ])}
              totalNumber={reducer(statistics?.all, "invoices", ["sent"])}
              icon={(props) => <DocumentCheckIcon {...props} />}
            />
            <NumberCard
              title="Factures en retard"
              number={statistics?.counters?.invoices.late ?? 0}
              totalNumber={statistics?.counters?.invoices.sent || 0}
              icon={(props) => <ClockIcon {...props} />}
            />
            <NumberCard
              title="Commandes en attente"
              number={statistics?.counters?.supplier_quotes.transit ?? 0}
              icon={(props) => <ShoppingCartIcon {...props} />}
            />
            <NumberCard
              title="Commandes à payer"
              number={statistics?.counters?.supplier_invoices?.sent ?? 0}
              icon={(props) => <DocumentArrowDownIcon {...props} />}
            />
          </div>
        </div>
      </div>
    </Page>
  );
};
