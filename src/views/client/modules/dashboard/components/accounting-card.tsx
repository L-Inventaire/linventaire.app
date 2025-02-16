import { Info } from "@atoms/text";
import { useDashboard } from "@features/statistics/hooks";
import { Dashboard } from "@features/statistics/types";
import { formatAmount } from "@features/utils/format/strings";
import { Heading, Text } from "@radix-ui/themes";
import { DateTime } from "luxon";
import React from "react";
import { twMerge } from "tailwind-merge";
import DashboardCard from "./card";
type AccountingCardProps = { year: number } & React.ComponentProps<"div">;

const AccountingCard = ({ year, ...props }: AccountingCardProps) => {
  const { all } = useDashboard(year);
  const { all: allLastYear } = useDashboard(year - 1);

  const loading = !allLastYear || !all;

  const reducer = (list: Dashboard["all"], type: string, states: string[]) =>
    (list || [])
      .filter((a) => a.type === type && states.includes(a.state))
      .reduce((acc, item) => acc + (parseFloat(item.amount_ht) ?? 0), 0);

  const prorataOfYear =
    year === new Date().getFullYear()
      ? DateTime.local().diff(DateTime.local().startOf("year")).as("days") / 365
      : 1;

  const gains =
    reducer(all, "invoices", ["completed", "closed"]) -
    reducer(all, "credit_notes", ["completed", "closed"]);
  const gainsExpected = gains / (prorataOfYear || 1);
  const gainsLastYear =
    reducer(allLastYear, "invoices", ["completed", "closed"]) -
    reducer(allLastYear, "credit_notes", ["completed", "closed"]);
  const gainsEvolution = Math.floor(
    (100 * (gainsExpected - gainsLastYear)) / gainsExpected
  );

  const charges =
    reducer(all, "supplier_invoices", ["completed", "closed"]) -
    reducer(all, "supplier_credit_notes", ["completed", "closed"]);
  const chargesExpected = charges / (prorataOfYear || 1);
  const chargesLastYear =
    reducer(allLastYear, "supplier_invoices", ["completed", "closed"]) -
    reducer(allLastYear, "supplier_credit_notes", ["completed", "closed"]);
  const chargesEvolution = Math.floor(
    (100 * (chargesExpected - chargesLastYear)) / chargesExpected
  );

  const revenue = gains - charges;
  const revenueExpected = gainsExpected - chargesExpected;
  const revenueLastYear = gainsLastYear - chargesLastYear;
  const revenueEvolution = Math.floor(
    (100 * (revenue - revenueLastYear)) / revenueLastYear
  );

  return (
    <DashboardCard
      {...props}
      className={twMerge(
        "flex flex-row justify-between w-full",
        props.className
      )}
    >
      {!loading && (
        <>
          <div className="flex flex-col w-1/3">
            <Text size="4">Chiffre d'affaires</Text>
            <Heading size="7" className="text-green-600 my-1">
              {formatAmount(gains ?? 0)}
            </Heading>
            <Info>
              {formatAmount(gainsExpected ?? 0)} estimé à cloture
              <br />
              {!!gainsExpected && (
                <>
                  <span
                    className={
                      gainsEvolution > 0 ? "text-green-500" : "text-red-500"
                    }
                  >
                    {(gainsEvolution < 0 ? "- " : "+ ") +
                      Math.abs(gainsEvolution)}
                    %
                  </span>{" "}
                  par rapport à {year - 1}
                </>
              )}
            </Info>
          </div>

          <div className="flex flex-col w-1/3">
            <Text size="4">Charges</Text>
            <Heading size="7" className="text-red-600 my-1">
              {formatAmount(charges ?? 0)}
            </Heading>
            <Info>
              {formatAmount(chargesExpected ?? 0)} estimé à cloture
              <br />
              {!!chargesExpected && (
                <>
                  <span
                    className={
                      chargesEvolution > 0 ? "text-red-500" : "text-green-500"
                    }
                  >
                    {(chargesEvolution < 0 ? "- " : "+ ") +
                      Math.abs(chargesEvolution)}
                    %
                  </span>{" "}
                  par rapport à {year - 1}
                </>
              )}
            </Info>
          </div>

          <div className="flex flex-col w-1/3">
            <Text size="4">Résultat</Text>
            <Heading size="7" className="text-blue-600 my-1">
              {formatAmount(revenue ?? 0)}
            </Heading>
            <Info>
              {formatAmount(revenueExpected ?? 0)} estimé à cloture
              <br />
              {!!revenueLastYear && (
                <>
                  <span
                    className={
                      revenueEvolution > 0 ? "text-green-500" : "text-red-500"
                    }
                  >
                    {(revenueEvolution < 0 ? "- " : "+ ") +
                      Math.abs(revenueEvolution)}
                    %
                  </span>{" "}
                  par rapport à {year - 1}
                </>
              )}
            </Info>
          </div>
        </>
      )}
    </DashboardCard>
  );
};

export default AccountingCard;
