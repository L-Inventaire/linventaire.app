import Select from "@atoms/input/input-select";
import { Title } from "@atoms/text";
import { Page } from "@views/client/_layout/page";
import { useState } from "react";

export const StatisticsPage = () => {
  const [page, setPage] = useState<string>("total-revenue");

  return (
    <Page
      title={[
        {
          label: "Comptabilité",
        },
      ]}
    >
      <div className="flex justify-between items-center mt-2 mb-8">
        <Title>Tableaux</Title>
        <Select
          onChange={(e) => {
            setPage(e.target.value);
          }}
          className="w-48"
        >
          <option value="tags">Chiffre d'affaires catégorisé</option>
          <option value="balances-clients">Balance clients</option>
          <option value="balances-suppliers">Balance fournisseurs</option>
        </Select>
      </div>
    </Page>
  );
};
