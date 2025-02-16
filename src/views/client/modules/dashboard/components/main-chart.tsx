import { useDashboard } from "@features/statistics/hooks";
import { Dashboard } from "@features/statistics/types";
import { ResponsiveLine } from "@nivo/line";
import { Text } from "@radix-ui/themes";
import { format } from "date-fns";
import _ from "lodash";
import DashboardCard from "./card";

type Processed = {
  gains: number;
  charges: number;
  revenue: number;
  month: string;
};

const processData = (data: Dashboard["all"]) => {
  const monthlyData: {
    [month: string]: Processed;
  } = {};

  data.forEach(({ type, state, month, amount_ht }) => {
    if (state !== "closed" && state !== "completed") return;

    month = month.split("-")[1];

    if (!monthlyData[month]) {
      monthlyData[month] = { gains: 0, charges: 0, revenue: 0, month };
    }

    const amount = parseFloat(amount_ht);

    if (type === "invoices") monthlyData[month].gains += amount;
    if (type === "credit_notes") monthlyData[month].gains -= amount;
    if (type === "supplier_invoices") monthlyData[month].charges -= amount;
    if (type === "supplier_credit_notes") monthlyData[month].charges += amount;
  });

  // Calculate revenue
  Object.values(monthlyData).forEach((entry) => {
    entry.revenue = entry.gains - entry.charges;
  });

  for (let i = 1; i <= 12; i++) {
    const month = i.toString().padStart(2, "0");
    if (!monthlyData[month]) {
      monthlyData[month] = { gains: 0, charges: 0, revenue: 0, month };
    }
  }

  return _.sortBy(Object.values(monthlyData), "month");
};

const MainChart = ({ year }: { year: number }) => {
  const { all } = useDashboard(year);
  const { all: allLastYear } = useDashboard(year - 1);

  if (!all || !allLastYear) return null;

  const currentYearData = processData(all);
  const previousYearData = processData(allLastYear);

  /*
  const formatWithK = (value: number) => {
    if (Math.abs(value) > 1000000) {
      return `${Math.floor(value / 1000000)}M`;
    } else if (Math.abs(value) > 1000) {
      return `${Math.floor(value / 1000)}K`;
    } else {
      return Math.floor(value) + "€";
    }
  };*/

  const gainsChargesData = [
    {
      id: "Gains",
      data: currentYearData.map((entry) => ({
        x: format(new Date(entry.month + "-01"), "MMM"),
        y: entry.gains,
      })),
    },
    {
      id: "Charges",
      data: currentYearData.map((entry) => ({
        x: format(new Date(entry.month + "-01"), "MMM"),
        y: entry.charges,
      })),
    },
  ];

  const revenueComparisonData = [
    {
      id: "Revenue",
      data: currentYearData.map((entry) => ({
        x: format(new Date(entry.month + "-01"), "MMM"),
        y: entry.revenue,
      })),
    },
    {
      id: "Revenue (Last Year)",
      data: previousYearData.map((entry) => ({
        x: format(new Date(entry.month + "-01"), "MMM"),
        y: entry.revenue,
      })),
    },
  ];

  return (
    <>
      <DashboardCard>
        <Text size="4">Gains & Charges</Text>{" "}
        <div className="w-full h-48 -mx-2">
          <ResponsiveLine
            data={gainsChargesData}
            margin={{ bottom: 40, top: 20, left: 10 }}
            xScale={{ type: "point" }}
            yScale={{ type: "linear", stacked: true }}
            enableArea={true}
            areaOpacity={0.3}
            axisBottom={{ tickSize: 5, tickPadding: 5, tickRotation: 0 }}
            axisLeft={null}
            colors={({ id }) => (id === "gains" ? "#16a34a" : "#dc2626")}
          />
        </div>
      </DashboardCard>

      <DashboardCard>
        <Text size="4">Revenue Comparison</Text>
        <div className="w-full h-48 -mx-2">
          <ResponsiveLine
            data={revenueComparisonData}
            margin={{ bottom: 40, top: 20, left: 10 }}
            xScale={{ type: "point" }}
            yScale={{ type: "linear", stacked: true }}
            enableArea={true}
            areaOpacity={0.3}
            axisBottom={{ tickSize: 5, tickPadding: 5, tickRotation: 0 }}
            axisLeft={null}
            colors={({ id }) => (id === "Gains" ? "#16a34a" : "#dc2626")}
          />
        </div>
      </DashboardCard>
    </>
  );
};

export default MainChart;
