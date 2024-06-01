import { MenuIndex, ROUTES, getRoute } from "@features/routes";

export const SettingsMenu: MenuIndex = (hasAccess) => ({
  prefix: "/settings/",
  menu: [
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
      label: "Préférences",
      to: getRoute(ROUTES.SettingsPreferences),
    },
    {
      type: "divider",
    },
    {
      type: "title",
      label: "Paramètres",
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
      label: "Importations",
      to: getRoute(ROUTES.SettingsImport),
    },
    {
      label: "Développeurs et API",
      to: getRoute(ROUTES.SettingsApi),
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
