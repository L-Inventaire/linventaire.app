import { Page } from "@views/client/_layout/page";
import { TotalRevenuePage } from "./total-revenue";
import { useState } from "react";
import { Title } from "@atoms/text";
import Select from "@atoms/input/input-select";
import { ClientBalancePage } from "./client-balance";
import { DateTime } from "luxon";
import { DateSelector } from "./components/date-selector";

export const StatisticsPage = () => {
  const [page, setPage] = useState<string>("total-revenue");

  const getTitle = () => {
    switch (page) {
      case "total-revenue":
        return "Chiffre d'affaires annuel";
      case "client-balance":
        return "Balance clients - retards de paiement";
      default:
        return "Comptabilité";
    }
  };

  const [startDate, setStartDate] = useState<Date>(
    DateTime.fromJSDate(new Date()).startOf("year").toJSDate()
  );
  const [endDate, setEndDate] = useState<Date>(
    DateTime.fromJSDate(startDate).endOf("year").toJSDate()
  );

  return (
    <Page
      title={[
        {
          label: "Comptabilité",
        },
      ]}
    >
      <div className="flex justify-between items-center mt-2 mb-8">
        <Title>{getTitle()}</Title>
        <DateSelector
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
        />
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
      {page === "total-revenue" && (
        <TotalRevenuePage
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
        />
      )}
      {page === "client-balance" && (
        <ClientBalancePage startDate={startDate} endDate={endDate} />
      )}
    </Page>
  );
};
