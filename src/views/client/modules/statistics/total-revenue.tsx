import { Info } from "@atoms/text";
import { generateQueryFromMap } from "@components/search-bar/utils/utils";
import { useDashboard } from "@features/statistics/hooks";
import { useTags } from "@features/tags/hooks/use-tags";
import { formatAmount } from "@features/utils/format/strings";
import { Table } from "@molecules/table";
import _ from "lodash";
import { DateTime } from "luxon";
import { useParams } from "react-router-dom";

type Row = {
  year: number;
  month: { value: string; label: string };
};

export type TotalRevenueProps = {
  startDate: Date;
  endDate: Date;
  setStartDate: (date: Date) => void;
  setEndDate: (date: Date) => void;
};

export const TotalRevenuePage = ({ startDate, endDate }: TotalRevenueProps) => {
  /*
  const { client: clientId } = useParams();
  const locale = navigator.language;

  const statistics = useDashboard(clientId, "year", startDate, endDate);
  const data = statistics.totalRevenueTable;
  const flatTagIDs = _.uniqBy(
    data.flatMap((item) => item.tag),
    (item) => JSON.stringify(item)
  );
  const tagIDs = _.uniqBy(
    data.map((item) => item.tag),
    (item) => JSON.stringify(item)
  ).filter(Boolean);

  const numberMonths =
    Math.floor(
      Math.abs(
        DateTime.fromJSDate(startDate).diff(DateTime.fromJSDate(endDate), [
          "months",
        ]).months
      )
    ) ?? 0;

  const monthsKeys = Array.from(Array(numberMonths).keys());

  const months = monthsKeys.map((num) => ({
    label:
      DateTime.fromJSDate(startDate)
        .startOf("month")
        .plus({ month: num })
        .setLocale(locale).monthShort +
      " " +
      DateTime.fromJSDate(startDate).startOf("month").plus({ month: num }).year,
    value:
      DateTime.fromJSDate(startDate)
        .startOf("month")
        .plus({ month: num })
        .toISODate() ?? new Date().toISOString(),
    year: DateTime.fromJSDate(startDate).startOf("month").plus({ month: num })
      .year,
  }));

  const { tags } = useTags({
    query: generateQueryFromMap({
      id: flatTagIDs,
    }),
  });

  const columns = [
    {
      title: "Période",
      id: "period",
      render: ({ month }: Row) => month.label,
    },
    ...tagIDs.map((tagTable) => {
      const foundTags = (tags?.data?.list ?? []).filter((tag) =>
        (tagTable || []).includes(tag.id)
      );

      return {
        title:
          foundTags.length === 0
            ? "Non classé"
            : foundTags.map((tag) => tag.name).join(", "),
        id:
          foundTags.length === 0
            ? "non-classified"
            : foundTags.map((tag) => tag.id).join(","),
        render: ({ month }: Row) => {
          const statFound = data.find((item) => {
            const foundDate = DateTime.fromISO(month.value, {
              zone: "utc",
            }).equals(DateTime.fromISO(item.month, { zone: "utc" }));

            return (
              foundDate &&
              _.isEqual(
                item.tag.filter(Boolean),
                foundTags.map((tag) => tag.id)
              )
            );
          });

          return (
            <>
              {statFound && formatAmount(statFound?.net_amount ?? 0)}
              {!statFound && <Info>{formatAmount(0)}</Info>}
            </>
          );
        },
      };
    }),
  ];

  return (
    <>
      <Table
        border
        columns={columns}
        data={months.flatMap((month) => ({ month, year: month.year }))}
      />
    </>
  );*/
  return null;
};
