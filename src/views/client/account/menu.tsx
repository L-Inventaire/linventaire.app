import { MenuIndex, ROUTES, getRoute } from "@features/routes";

export const AccountMenu: MenuIndex = () => ({
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
  ],
});
