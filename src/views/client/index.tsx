import { Confetti } from "@atoms/confetti";
import { AnimatedBackground } from "@components/animated-background";
import { useAuth } from "@features/auth/state/use-auth";
import { useWebsockets } from "@features/auth/state/use-sockets";
import { DidCreateCompanyOrSignupAtom } from "@features/clients/state/store";
import { useClients } from "@features/clients/state/use-clients";
import { ROUTES, getRoute, useRoutes } from "@features/routes";
import { DefaultScrollbars } from "@features/utils/scrollbars";
import { Modals } from "@views/modals";
import { Navigate, Outlet, Route, useNavigate } from "react-router-dom";
import { useRecoilState, useRecoilValue } from "recoil";
import { twMerge } from "tailwind-merge";
import { Header, ResponsiveMenuAtom } from "./_layout/header";
import { SecondSideBar } from "./_layout/second-sidebar";
import { SideBar } from "./_layout/sidebar";
import { AccountClientsPage } from "./account/clients";
import { AccountPage } from "./account/profil";
import { SecurityPage } from "./account/security";
import { ArticlesPage } from "./modules/articles";
import { ArticlesEditPage } from "./modules/articles/edit";
import { ArticlesViewPage } from "./modules/articles/view";
import { ContactsPage } from "./modules/contacts";
import { ContactsEditPage } from "./modules/contacts/edit";
import { ContactsViewPage } from "./modules/contacts/view";
import { DashboardHomePage } from "./modules/dashboard/home";
import { InvoicesPage } from "./modules/invoices";
import { InvoicesEditPage } from "./modules/invoices/edit";
import { InvoicesViewPage } from "./modules/invoices/view";
import { OrdersPage } from "./modules/orders";
import { OrdersEditPage } from "./modules/orders/edit";
import { OrdersViewPage } from "./modules/orders/view";
import { NoClientView } from "./no-client";
import { CompanyPage } from "./settings/company";
import { FieldsPage } from "./settings/fields";
import { CompanyPlanPage } from "./settings/plan";
import { PreferencesPage } from "./settings/preferences";
import { TagsPage } from "./settings/tags";
import { CompanyUsersPage } from "./settings/users";
import { DevPage } from "./_dev";

export const BackOfficeRoutes = () => {
  return (
    <>
      <Route path={ROUTES.JoinCompany} element={<NoClientView />} />
      <Route path={ROUTES.CreateCompany} element={<NoClientView create />} />
      <Route element={<Layout />}>
        <Route
          path={ROUTES.Account}
          element={<Navigate to={getRoute(ROUTES.AccountProfile)} />}
        />
        <Route path={ROUTES.AccountProfile} element={<AccountPage />} />
        <Route path={ROUTES.AccountClients} element={<AccountClientsPage />} />
        <Route path={ROUTES.AccountSecurity} element={<SecurityPage />} />

        <Route path={ROUTES.Contacts} element={<ContactsPage />} />
        <Route path={ROUTES.ContactsView} element={<ContactsViewPage />} />
        <Route path={ROUTES.ContactsEdit} element={<ContactsEditPage />} />

        <Route path={ROUTES.Products} element={<ArticlesPage />} />
        <Route path={ROUTES.ProductsView} element={<ArticlesViewPage />} />
        <Route path={ROUTES.ProductsEdit} element={<ArticlesEditPage />} />

        <Route path={ROUTES.Orders} element={<OrdersPage />} />
        <Route path={ROUTES.OrdersView} element={<OrdersViewPage />} />
        <Route path={ROUTES.OrdersEdit} element={<OrdersEditPage />} />

        <Route path={ROUTES.Invoices} element={<InvoicesPage />} />
        <Route path={ROUTES.InvoicesView} element={<InvoicesViewPage />} />
        <Route path={ROUTES.InvoicesEdit} element={<InvoicesEditPage />} />

        <Route
          path={ROUTES.Settings}
          element={<Navigate to={getRoute(ROUTES.SettingsPreferences)} />}
        />
        <Route
          path={ROUTES.SettingsPreferences}
          element={<PreferencesPage />}
        />
        <Route path={ROUTES.SettingsTags} element={<TagsPage />} />
        <Route path={ROUTES.SettingsCustomFields} element={<FieldsPage />} />
        <Route path={ROUTES.SettingsCompany} element={<CompanyPage />} />
        <Route path={ROUTES.SettingsUsers} element={<CompanyUsersPage />} />
        <Route path={ROUTES.SettingsBilling} element={<CompanyPlanPage />} />

        <Route path={ROUTES.Home} element={<DashboardHomePage />} />
        <Route path={ROUTES.Invoices} element={<InvoicesPage />} />

        <Route path={ROUTES.DevPage} element={<DevPage />} />
      </Route>
    </>
  );
};

export const Layout = () => {
  const [menuOpen, setMenuOpen] = useRecoilState(ResponsiveMenuAtom);
  useWebsockets();
  const { user, logout } = useAuth();
  const { clients, loading } = useClients();
  const afterSignupOrNewCompany = useRecoilValue(DidCreateCompanyOrSignupAtom);
  const navigate = useNavigate();
  useRoutes();

  if (!user?.id) {
    logout();
    return <></>;
  }

  if (clients.length === 0) {
    if (!loading) {
      navigate(ROUTES.JoinCompany);
    }

    return <></>;
  }

  return (
    <>
      {afterSignupOrNewCompany && <Confetti />}
      <div
        className={twMerge(
          "sm:overflow-auto overflow-hidden relative flex w-full grow flex-row bg-slate-50 dark:bg-slate-800 h-screen intro-animated-root z-10",
          afterSignupOrNewCompany ? "fade-in-slow" : ""
        )}
      >
        <SideBar />
        <div
          className={
            "z-0 transition-all grow flex flex-col sm:ml-64 print:ml-0"
          }
          style={{
            transform: menuOpen ? "translateX(80px)" : "translateX(0)",
          }}
        >
          <Header />
          <div
            className={twMerge(
              "grow flex min-h-0 border-t sm:border shadow-sm bg-white border-slate-100 dark:border-slate-950 print:mx-0 sm:mb-2 rounded",
              menuOpen ? "sm:ml-64" : "sm:mr-2 sm:ml-0"
            )}
            onClick={() => setMenuOpen(false)}
          >
            <SecondSideBar />
            <div
              className={
                "grow flex min-h-0 dark:bg-slate-950 transition-all " +
                (menuOpen ? " opacity-25 pointer-events-none " : "opacity-100 ")
              }
            >
              <Outlet />
            </div>
          </div>
        </div>
      </div>
      <Modals />
      <AnimatedBackground />
    </>
  );
};
