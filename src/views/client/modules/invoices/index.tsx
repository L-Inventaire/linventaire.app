import { Button } from "@atoms/button/button";
import { DropDownAtom } from "@atoms/dropdown";
import { Page } from "@views/client/_layout/page";
import { useTranslation } from "react-i18next";
import { useSetRecoilState } from "recoil";

export const InvoicesPage = () => {
  const { t } = useTranslation();
  const setState = useSetRecoilState(DropDownAtom);

  return (
    <Page
      actions={
        <>
          <Button size="sm">Créer une facture</Button>
          <Button size="sm" theme="secondary">
            Créer un devis
          </Button>
        </>
      }
      title={[
        {
          label: "Les Factures",
        },
      ]}
    >
      <Button
        onClick={(e) => {
          setState({
            target: e.currentTarget,
            position: "bottom",
            menu: [
              {
                label: "Créer une facture",
                shortcut: ["shift+f"],
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
                shortcut: ["shift+f"],
              },
              {
                type: "divider",
              },
              {
                label: "Factures",
                shortcut: ["f"],
              },
              {
                label: "Devis",
                shortcut: ["d"],
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
                shortcut: ["ctrl+del"],
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
