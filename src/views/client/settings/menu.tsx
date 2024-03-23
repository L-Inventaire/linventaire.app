import { MenuIndex, ROUTES, getRoute } from "@features/routes";

export const SettingsMenu: MenuIndex = (hasAccess) => ({
  prefix: "/settings/",
  menu: [
    {
      type: "title",
      label: "Paramètres",
    },
    {
      label: "Préférences",
      to: getRoute(ROUTES.SettingsPreferences),
    },
    {
      label: "Étiquettes",
      to: getRoute(ROUTES.SettingsTags),
    },
    {
      label: "Champs personnalisés",
      to: getRoute(ROUTES.SettingsCustomFields),
    },
    {
      label: "Développeurs",
      to: getRoute(ROUTES.SettingsApi),
    },
    {
      type: "divider",
    },
    {
      type: "title",
      label: "Entreprise",
    },
    {
      label: "Votre entreprise",
      to: getRoute(ROUTES.SettingsCompany),
    },
    {
      label: "Collaborateurs",
      to: getRoute(ROUTES.SettingsUsers),
    },
    {
      type: "divider",
    },
    {
      type: "title",
      label: "Abonnement",
    },
    {
      label: "Paiements et plans",
      to: getRoute(ROUTES.SettingsBilling),
    },
  ],
});
