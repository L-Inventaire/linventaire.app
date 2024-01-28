import { Button } from "@atoms/button/button";
import { DropDownAtom, DropDownMenu } from "@atoms/dropdown";
import { Page } from "@atoms/layout/page";
import { useTranslation } from "react-i18next";
import { useSetRecoilState } from "recoil";

export const DemoPage = () => {
  const { t } = useTranslation();
  const setState = useSetRecoilState(DropDownAtom);

  return (
    <Page>
      <Button
        onClick={(e) => {
          setState({
            target: e.currentTarget,
            position: "bottom",
            menu: [
              {
                label: "Créer une facture",
                shortcut: ["shift+F"],
              },
            ],
          });
        }}
      >
        Test 1
      </Button>
      <br />
      <br />
      <br />
      <Button
        onClick={(e) => {
          setState({
            target: e.currentTarget,
            position: "right",
            menu: [
              {
                label: "Créer une facture",
                shortcut: ["shift+F"],
              },
              {
                type: "divider",
              },
              {
                label: "Factures",
                shortcut: ["F"],
              },
              {
                label: "Devis",
                shortcut: ["D"],
              },
              {
                label: "Archives",
              },
              {
                type: "divider",
              },
              {
                type: "danger",
                label: "Logout",
                shortcut: ["cmd+del", "ctrl+del"],
              },
            ],
          });
        }}
      >
        {t("demo.button")}
      </Button>
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
      <br />
      HEY
    </Page>
  );
};
