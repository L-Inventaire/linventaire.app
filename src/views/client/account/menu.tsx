import { DropDownMenuType } from "@atoms/dropdown";
import { registerRootNavigation } from "@components/ctrl-k";
import { MenuIndex, ROUTES, getRoute } from "@features/routes";

export const AccountMenu: MenuIndex = () => {
  const bar = {
    prefix: "/account/",
    menu: [
      {
        type: "title",
        label: "Compte",
      },
      {
        label: "Préférence et profil",
        to: getRoute(ROUTES.AccountProfile),
      },
      {
        label: "Sécurité",
        to: getRoute(ROUTES.AccountSecurity),
      },
      {
        type: "divider",
      },
      {
        type: "title",
        label: "Entreprise",
      },
      {
        label: "Gérer mes entreprise",
        to: getRoute(ROUTES.AccountClients),
      },
    ] as DropDownMenuType,
  };

  for (const item of bar.menu) {
    if (item.to)
      registerRootNavigation({
        label: "Compte > " + item.label,
        keywords: [],
        to: item.to,
        priority: -100,
      });
  }

  return bar;
};
