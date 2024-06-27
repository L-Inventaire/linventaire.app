import { DropDownMenuType } from "@atoms/dropdown";
import { registerRootNavigation } from "@features/ctrlk";
import { MenuIndex, ROUTES, getRoute } from "@features/routes";
import { useTranslation } from "react-i18next";

export const useAccountMenu: MenuIndex = () => {
  const { t } = useTranslation();

  const bar = {
    prefix: "/account/",
    menu: [
      {
        type: "title",
        label: t("menu.account.title"),
      },
      {
        label: t("menu.account.profile"),
        to: getRoute(ROUTES.AccountProfile),
      },
      {
        label: t("menu.account.security"),
        to: getRoute(ROUTES.AccountSecurity),
      },
      {
        type: "divider",
      },
      {
        type: "title",
        label: t("menu.account.enterprise"),
      },
      {
        label: t("menu.account.manage_companies"),
        to: getRoute(ROUTES.AccountClients),
      },
    ] as DropDownMenuType,
  };

  for (const item of bar.menu) {
    if (item.to)
      registerRootNavigation({
        label: t("menu.account.ctrlk_prefix") + " > " + item.label,
        keywords: [],
        to: item.to,
        priority: -100,
      });
  }

  return bar;
};
