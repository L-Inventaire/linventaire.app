import { generateQueryFromMap } from "@components/search-bar/utils/utils";
import { useStatistics } from "@features/statistics/hooks";
import { useTags } from "@features/tags/hooks/use-tags";
import { formatAmount } from "@features/utils/format/strings";
import { Button, Table } from "@radix-ui/themes";
import { Page } from "@views/client/_layout/page";
import _ from "lodash";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export const StatisticsPage = () => {
  const { client: clientId } = useParams();
  const locale = navigator.language;

  const statistics = useStatistics(clientId, "year");
  const data = statistics.totalRevenueTable;
  const flatTagIDs = _.uniq(data.flatMap((item) => item.tag));
  const tagIDs = _.uniq(data.map((item) => item.tag)).filter(Boolean);

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

  return (
    <Page
      title={[
        {
          label: "Statistiques",
        },
      ]}
    >
      {years.map((year) => {
        return (
          <>
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Période</Table.ColumnHeaderCell>
                  {tagIDs.map((tagTable) => {
                    const foundTags = (tags?.data?.list ?? []).filter((tag) =>
                      (tagTable || []).includes(tag.id)
                    );
                    return (
                      <Table.ColumnHeaderCell>
                        {foundTags.length === 0 && "Non classé"}
                        {foundTags.map((tag) => tag.name).join(", ")}
                      </Table.ColumnHeaderCell>
                    );
                  })}
                </Table.Row>
                <Table.Row>
                  <Table.ColumnHeaderCell className={"flex items-center"}>
                    <Button
                      className="mr-2"
                      onClick={() =>
                        setYears((data) =>
                          [...data].map((dataYear) =>
                            dataYear.year === year.year
                              ? { ...dataYear, open: !year.open }
                              : dataYear
                          )
                        )
                      }
                    >
                      -
                    </Button>{" "}
                    {year.year}
                  </Table.ColumnHeaderCell>
                  {tagIDs.map(() => {
                    return (
                      <Table.ColumnHeaderCell>Total HT.</Table.ColumnHeaderCell>
                    );
                  })}
                </Table.Row>
              </Table.Header>

              {year.open && (
                <Table.Body>
                  {months.map((month) => {
                    return (
                      <Table.Row>
                        <Table.RowHeaderCell>{month.label}</Table.RowHeaderCell>
                        {tagIDs.map((tag) => {
                          const statFound = data.find((item) => {
                            return (
                              DateTime.fromISO(month.value, {
                                zone: "utc",
                              }).equals(
                                DateTime.fromISO(item.month, { zone: "utc" })
                              ) &&
                              year.year ===
                                DateTime.fromISO(item.year, { zone: "utc" })
                                  .year &&
                              _.isEqual(item.tag, tag)
                            );
                          });
                          return (
                            <Table.Cell>
                              {statFound && formatAmount(statFound?.sum ?? 0)}
                            </Table.Cell>
                          );
                        })}
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              )}
            </Table.Root>
          </>
        );
      })}
    </Page>
  );
};
