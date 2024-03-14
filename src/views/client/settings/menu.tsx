import { MenuIndex, ROUTES, getRoute } from "@features/routes";

export const SettingsMenu: MenuIndex = (hasAccess) => ({
  prefix: "/settings/",
  menu: [
    {
      type: "title",
      label: "Paramètres",
    },
    {
      label: "Paramètres de L'inventaire",
      to: getRoute(ROUTES.SettingsPreferences),
    },
    {
      label: "Votre entreprise",
      to: getRoute(ROUTES.SettingsCompany),
    },
    {
      label: "Colaborateurs",
      to: getRoute(ROUTES.SettingsUsers),
    },
    {
      type: "divider",
    },
    {
      type: "label",
      label: "Abonnement",
    },
    {
      label: "Paiements et plans",
      to: getRoute(ROUTES.SettingsBilling),
    },
  ],
});
