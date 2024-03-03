/** Describes application routes **/

import { DropDownMenuType } from "@atoms/dropdown";
import { useParams } from "react-router-dom";
import { Role } from "./clients/types/clients";

export type MenuIndex = (hasAccess: (role: Role) => boolean) => {
  prefix: string;
  menu: DropDownMenuType;
};

let currentClient = window.localStorage.getItem("client") || "";

export const useRoutes = () => {
  const { client } = useParams();
  currentClient = client || "-";
  window.localStorage.setItem("client", currentClient);
  return {
    get: getRoute,
  };
};

export const getRoute = (route: string, params: any = {}) => {
  params = {
    client: currentClient,
    ...params,
  };
  return Object.keys(params).reduce((acc, key) => {
    return acc.replace(`:${key}`, params[key]);
  }, route);
};

export const ROUTES = {
  Login: "/login",
  SignUp: "/login/signup",
  JoinCompany: "/join-company",
  CreateCompany: "/create-company",

  Account: "/:client/account",
  AccountProfile: "/:client/account/profile",
  AccountSecurity: "/:client/account/security",
  AccountClients: "/:client/account/clients",

  Home: "/:client/home",
  Notifications: "/:client/notifications",
  Events: "/:client/events",

  Statistics: "/:client/statistics",

  Contacts: "/:client/contacts",
  ContactsView: "/:client/contacts/:id",
  ContactsEdit: "/:client/contacts/:id/form",

  Invoices: "/:client/invoices",
  InvoicesView: "/:client/invoices/:id",
  InvoicesEdit: "/:client/invoices/:id/form",
  Quotes: "/:client/quotes",
  QuotesView: "/:client/quotes/:id",
  QuotesEdit: "/:client/quotes/:id/form",
  Subscriptions: "/:client/subscriptions",
  SubscriptionsView: "/:client/subscriptions/:id",
  SubscriptionsEdit: "/:client/subscriptions/:id/form",

  Orders: "/:client/orders",
  OrdersView: "/:client/orders/:id",
  OrdersEdit: "/:client/orders/:id/form",

  Receipts: "/:client/deliveries",
  ReceiptsView: "/:client/deliveries/:id",
  ReceiptsEdit: "/:client/deliveries/:id/form",

  Stock: "/:client/stock",

  Consulting: "/:client/consulting",
  ConsultingView: "/:client/consulting/:id",
  ConsultingEdit: "/:client/consulting/:id/form",

  Products: "/:client/products",
  ProductsView: "/:client/products/:id",
  ProductsEdit: "/:client/products/:id/form",

  Settings: "/:client/settings",
  SettingsPreferences: "/:client/settings/preferences",
  SettingsCompany: "/:client/settings/company",
  SettingsUsers: "/:client/settings/users",
  SettingsBilling: "/:client/settings/billing",
};
