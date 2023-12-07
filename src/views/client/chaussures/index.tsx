import React from "react";
import { Page } from "@atoms/layout/page";
import { Title } from "@atoms/text";
import { useTranslation } from "react-i18next";

export const ChaussurePage = () => {
  const { t } = useTranslation();
  return (
    <Page>
      <Title>Test</Title>
      {t("Je suis une page dédiée à la vente de chaussures")}
    </Page>
  );
};
