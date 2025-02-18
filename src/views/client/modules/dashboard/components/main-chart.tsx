import { useDashboard } from "@features/statistics/hooks";
import { Dashboard } from "@features/statistics/types";
import { ResponsiveLine } from "@nivo/line";
import { Text } from "@radix-ui/themes";
import { format } from "date-fns";
import _ from "lodash";
import DashboardCard from "./card";
import { formatAmount } from "@features/utils/format/strings";

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
    if (state === "draft") return;

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
    entry.revenue = entry.gains + entry.charges;
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

  const formatWithK = (value: number) => {
    if (Math.abs(value) > 1000000) {
      return `${Math.floor(value / 1000000)}M`;
    } else if (Math.abs(value) > 1000) {
      return `${Math.floor(value / 1000)}K`;
    } else {
      return Math.floor(value) + "€";
    }
  };

  const gainsChargesData = [
    {
      id: "gains",
      data: currentYearData.map((entry) => ({
        x: format(new Date(entry.month + "-01"), "MMM"),
        y: entry.gains,
      })),
    },
    {
      id: "charges",
      data: currentYearData.map((entry) => ({
        x: format(new Date(entry.month + "-01"), "MMM"),
        y: -entry.charges,
      })),
    },
  ];

  const revenueComparisonData = [
    {
      id: year,
      data: currentYearData.map((entry) => ({
        x: format(new Date(entry.month + "-01"), "MMM"),
        y: entry.revenue,
      })),
    },
    {
      id: year - 1,
      data: previousYearData.map((entry) => ({
        x: format(new Date(entry.month + "-01"), "MMM"),
        y: entry.revenue,
      })),
    },
  ];

  return (
    <>
      <DashboardCard>
        <Text size="4">Chiffre d'affaires et charges</Text>{" "}
        <div className="w-full h-48 -mx-4">
          <ResponsiveLine
            data={gainsChargesData}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            xScale={{ type: "point" }}
            yScale={{ type: "linear", min: "auto", max: "auto" }}
            enableArea={true}
            areaOpacity={0.1}
            areaBaselineValue={0}
            areaBlendMode="normal"
            curve="monotoneX"
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              format: (value) => value[0],
            }}
            axisLeft={null}
            gridYValues={[]}
            pointSize={8}
            enablePointLabel={true}
            pointLabel={(point) => formatWithK(point.data.y as number)}
            pointLabelYOffset={-12}
            colors={({ id }) => (id === "gains" ? "#16a34a" : "#dc2626")}
            enableSlices="x"
            sliceTooltip={({ slice }) => (
              <div className="bg-white dark:bg-slate-950 p-2 rounded shadow-md">
                <div>
                  <strong>{slice.points[0].data.xFormatted}</strong>
                </div>
                <div>
                  Chiffre d'affaires:{" "}
                  <b>
                    {formatAmount(
                      slice.points.find((a) => a.serieId === "gains")?.data
                        .yFormatted as any
                    )}
                  </b>
                </div>
                <div>
                  Charges:{" "}
                  <b>
                    {formatAmount(
                      slice.points.find((a) => a.serieId === "charges")?.data
                        .yFormatted as any
                    )}
                  </b>
                </div>
              </div>
            )}
            /** Gradient definitions */
            defs={[
              {
                id: "gradientGains",
                type: "linearGradient",
                colors: [
                  { offset: 0, color: "#16a34a", opacity: 1 }, // Green at 50% opacity
                  { offset: 100, color: "#16a34a", opacity: 0 }, // Transparent at bottom
                ],
              },
              {
                id: "gradientCharges",
                type: "linearGradient",
                colors: [
                  { offset: 0, color: "#dc2626", opacity: 1 }, // Red at 50% opacity
                  { offset: 100, color: "#dc2626", opacity: 0 }, // Transparent at bottom
                ],
              },
            ]}
            /** Apply the gradients to each line */
            fill={[
              { match: { id: "gains" }, id: "gradientGains" },
              { match: { id: "charges" }, id: "gradientCharges" },
            ]}
          />
        </div>
      </DashboardCard>

      <DashboardCard>
        <Text size="4">
          Résultat {year} / {year - 1}
        </Text>
        <div className="w-full h-48 -mx-4">
          <ResponsiveLine
            data={revenueComparisonData}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            xScale={{ type: "point" }}
            yScale={{ type: "linear", min: "auto", max: "auto" }}
            enableArea={true}
            areaOpacity={0.1}
            areaBaselineValue={0}
            areaBlendMode="normal"
            curve="monotoneX"
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              format: (value) => value[0],
            }}
            axisLeft={null}
            gridYValues={[]}
            pointSize={8}
            enablePointLabel={true}
            pointLabelYOffset={-12}
            pointLabel={(point) => formatWithK(point.data.y as number)}
            colors={({ id }) => (id + "" === year + "" ? "#2563eb" : "#cccccc")}
            enableSlices="x"
            sliceTooltip={({ slice }) => (
              <div className="bg-white dark:bg-slate-950 p-2 rounded shadow-md">
                <div>
                  <strong>{slice.points[0].data.xFormatted}</strong>
                </div>
                <div>
                  {year}:{" "}
                  <b>
                    {formatAmount(
                      slice.points.find((a) => a.serieId === year)?.data
                        .yFormatted as any
                    )}
                  </b>
                </div>
                <div>
                  {year - 1}:{" "}
                  {formatAmount(
                    slice.points.find((a) => a.serieId === year - 1)?.data
                      .yFormatted as any
                  )}
                </div>
              </div>
            )}
            /** Gradient definitions */
            defs={[
              {
                id: "gradientCurrent",
                type: "linearGradient",
                colors: [
                  { offset: 0, color: "#2563eb", opacity: 1 }, // Green at 50% opacity
                  { offset: 100, color: "#2563eb", opacity: 0 }, // Transparent at bottom
                ],
              },
              {
                id: "gradientLast",
                type: "linearGradient",
                colors: [
                  { offset: 0, color: "#cccccc", opacity: 1 }, // Red at 50% opacity
                  { offset: 100, color: "#cccccc", opacity: 0 }, // Transparent at bottom
                ],
              },
            ]}
            /** Apply the gradients to each line */
            fill={[
              { match: { id: year }, id: "gradientCurrent" },
              { match: { id: year - 1 }, id: "gradientLast" },
            ]}
          />
        </div>
      </DashboardCard>
    </>
  );
};

export default MainChart;
