import { Page } from "@atoms/layout/page";
import { Title } from "@atoms/text";
import { Table } from "@components/table";
import { Column } from "@components/table/table";
import { useControlledEffect } from "@features/utils/hooks/use-controlled-effect";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const TabPage = () => {
  type Device = {
    id: number;
    title: string;
    description: string;
  };

  const { t } = useTranslation();

  const [data, setData] = useState<any[]>([]);

  const title: Column<Device> = {
    title: "Product",
    render: (item) => item["title"],
  };

  const infos: Column<Device> = {
    title: "Infos",
    render: (item) => item.description,
  };

  useControlledEffect(() => {
    fetch("https://dummyjson.com/products?limit=30")
      .then((res) => res.json())
      .then((json) => {
        setData([...data, ...json["products"]]);
      });
  }, [setData]);

  return (
    <Page>
      <Title>{t("TABLEAU")}</Title>
      {t("Je suis un tableau")}
      <Table
        columns={[title, infos]}
        rowIndex="id"
        data={data}
        scrollable={false}
        onSelect={(item) => item}
        onRequestData={async ({ page, perPage, order }) => {
          console.log(page, perPage, order);
        }}
        total={data.length}
        showPagination={true}
        initialPagination={{
          page: 1,
          perPage: 5,
          order: "ASC",
        }}
      />
    </Page>
  );
};
