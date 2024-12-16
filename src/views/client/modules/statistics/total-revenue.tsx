import { Info } from "@atoms/text";
import { generateQueryFromMap } from "@components/search-bar/utils/utils";
import { useStatistics } from "@features/statistics/hooks";
import { useTags } from "@features/tags/hooks/use-tags";
import { formatAmount } from "@features/utils/format/strings";
import { Table } from "@molecules/table";
import _ from "lodash";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

type Row = {
  year: {
    year: number;
    open: boolean;
  };
  month: { value: string; label: string };
};

export const TotalRevenuePage = () => {
  const { client: clientId } = useParams();
  const locale = navigator.language;

  const statistics = useStatistics(clientId, "year");
  const data = statistics.totalRevenueTable;
  const flatTagIDs = _.uniqBy(
    data.flatMap((item) => item.tag),
    (item) => JSON.stringify(item)
  );
  const tagIDs = _.uniqBy(
    data.map((item) => item.tag),
    (item) => JSON.stringify(item)
  ).filter(Boolean);

  const start = DateTime.now().startOf("year");

  const [years, setYears] = useState<{ year: number; open: boolean }[]>([]);

  useEffect(() => {
    setYears(
      _.uniq(data.flatMap((item) => item.year)).map((year) => ({
        year: DateTime.fromISO(year).year,
        open: true,
      }))
    );
  }, [data]);

  const months = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num) => ({
    label:
      start.plus({ month: num }).setLocale(locale).monthShort +
      " " +
      start.year,
    value: start.plus({ month: num }).toISODate(),
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
        render: ({ year, month }: Row) => {
          const statFound = data.find((item) => {
            return (
              DateTime.fromISO(month.value, {
                zone: "utc",
              }).equals(DateTime.fromISO(item.month, { zone: "utc" })) &&
              year.year === DateTime.fromISO(item.year, { zone: "utc" }).year &&
              _.isEqual(
                item.tag,
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
        data={years.flatMap((year) => {
          return months.flatMap((month) => ({ month, year }));
        })}
      />
    </>
  );
};
