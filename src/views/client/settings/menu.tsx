import { DropDownMenuType } from "@atoms/dropdown";
import { registerRootNavigation } from "@features/ctrlk";
import { MenuIndex, ROUTES, getRoute } from "@features/routes";
import { useTranslation } from "react-i18next";

export const useSettingsMenu: MenuIndex = () => {
  const { t } = useTranslation();

  const bar = {
    prefix: "/settings/",
    menu: [
      {
        type: "title",
        label: t("menu.settings.title"),
      },
      {
        label: t("menu.settings.company"),
        to: getRoute(ROUTES.SettingsCompany),
      },
      {
        label: t("menu.settings.users"),
        to: getRoute(ROUTES.SettingsUsers),
      },
      {
        type: "divider",
      },
      {
        type: "title",
        label: t("menu.settings.activity_preferences_title"),
      },
      {
        label: t("menu.settings.activity_format"),
        to: getRoute(ROUTES.SettingsInvoices),
      },
      {
        label: t("menu.settings.stock_services"),
        to: getRoute(ROUTES.SettingsStockServices),
      },
      {
        label: t("menu.settings.stock_locations"),
        to: getRoute(ROUTES.SettingsStockLocations),
      },
      {
        label: t("menu.settings.bank_accounts"),
        to: getRoute(ROUTES.SettingsBankAccounts),
      },
      {
        type: "divider",
      },
      {
        type: "title",
        label: t("menu.settings.general_preferences_title"),
      },
      {
        label: t("menu.settings.tags"),
        to: getRoute(ROUTES.SettingsTags),
      },
      {
        label: t("menu.settings.custom_fields"),
        to: getRoute(ROUTES.SettingsCustomFields),
      },
      {
        label: t("menu.settings.more"),
        to: getRoute(ROUTES.SettingsPreferences),
      },
      /*{
        label: t("menu.settings.import"),
        to: getRoute(ROUTES.SettingsImport),
      },
      {
        label: t("menu.settings.api"),
        to: getRoute(ROUTES.SettingsApi),
      },*/
      {
        type: "divider",
      },
      {
        type: "title",
        label: t("menu.settings.billing_title"),
      },
      {
        label: t("menu.settings.billing"),
        to: getRoute(ROUTES.SettingsBilling),
      },
    ] as DropDownMenuType,
  };

  for (const item of bar.menu) {
    if (item.to)
      registerRootNavigation({
        label: t("menu.settings.ctrl_prefix") + " > " + item.label,
        keywords: [],
        to: item.to,
        priority: -50,
      });
  }

  return bar;
};
