import Select from "@atoms/input/input-select";
import { Title } from "@atoms/text";
import { Page } from "@views/client/_layout/page";
import { useState } from "react";
import { TagsPage } from "./tags";
import { BalancesPage } from "./balances";

export const StatisticsPage = () => {
  const [page, setPage] = useState<string>("tags");
  const [year, setYear] = useState<number>(new Date().getFullYear());

  return (
    <Page
      title={[
        {
          label: "Comptabilité",
        },
      ]}
    >
      <div className="w-full relative">
        <div className="flex justify-between items-center mt-2 mb-8 space-x-4">
          <Title>Tableaux</Title>
          <div className="flex gap-2">
            <Select
              onChange={(e) => {
                setPage(e.target.value);
              }}
              className="w-56"
            >
              <option value="tags">Chiffre d'affaires catégorisé</option>
              <option value="balances-clients">Balance clients</option>
              <option value="balances-suppliers">Balance fournisseurs</option>
            </Select>
            {page === "tags" && (
              <Select
                value={year.toString()}
                onChange={(e) => {
                  setYear(parseInt(e.target.value));
                }}
                className="w-max"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year.toString()}>
                      {year}
                    </option>
                  );
                })}
              </Select>
            )}
          </div>
          <div className="grow" />
        </div>

        {page === "tags" && <TagsPage year={year} />}
        {page === "balances-clients" && <BalancesPage type="client" />}
        {page === "balances-suppliers" && <BalancesPage type="supplier" />}
      </div>
    </Page>
  );
};
