import { Page } from "@atoms/layout/page";
import { Title } from "@atoms/text";
import { useTranslation } from "react-i18next";

export const DemoPage = () => {
  const { t } = useTranslation();
  return (
    <Page>
      <Title>{t("demo.title")}</Title>
      {t("demo.hello")}
    </Page>
  );
};
