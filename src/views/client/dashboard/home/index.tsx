import { DropDownAtom } from "@atoms/dropdown";
import { Page } from "@views/client/_layout/page";
import { useTranslation } from "react-i18next";
import { useSetRecoilState } from "recoil";

export const DashboardHomePage = () => {
  const { t } = useTranslation();
  const setState = useSetRecoilState(DropDownAtom);

  return (
    <Page
      title={[
        {
          label: "Dashboard",
        },
      ]}
    >
      Welcome to your dashboard
    </Page>
  );
};
