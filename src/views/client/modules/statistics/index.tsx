import { Page } from "@views/client/_layout/page";
import { TotalRevenuePage } from "./total-revenue";
import { useState } from "react";
import { Title } from "@atoms/text";
import Select from "@atoms/input/input-select";
import { ClientBalancePage } from "./client-balance";

export const StatisticsPage = () => {
  const [page, setPage] = useState<string>("total_revenue");

  const getTitle = () => {
    switch (page) {
      case "total_revenue":
        return "Chiffre d'affaires annuel";
      case "client_balance":
        return "Balance clients";
      default:
        return "Statistiques";
    }
  };

  return (
    <Page
      title={[
        {
          label: "Statistiques",
        },
      ]}
    >
      <div className="flex justify-between items-center mb-8">
        <Title>{getTitle()}</Title>
        <Select
          onChange={(e) => {
            setPage(e.target.value);
          }}
          className="w-48"
        >
          <option value="total-revenue">Chiffre d'affaires</option>
          <option value="client-balance">Balance clients</option>
        </Select>
      </div>
      {page === "total-revenue" && <TotalRevenuePage />}
      {page === "client-balance" && <ClientBalancePage />}
    </Page>
  );
};
