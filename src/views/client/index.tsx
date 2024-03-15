import { Confetti } from "@atoms/confetti";
import { AnimatedBackground } from "@components/animated-background";
import { useAuth } from "@features/auth/state/use-auth";
import { DidCreateCompanyOrSignupAtom } from "@features/clients/state/store";
import { useClients } from "@features/clients/state/use-clients";
import { ROUTES, getRoute, useRoutes } from "@features/routes";
import { Modals } from "@views/modals";
import { Navigate, Outlet, Route, useNavigate } from "react-router-dom";
import { useRecoilState, useRecoilValue } from "recoil";
import { Header } from "./_layout/header";
import { SecondSideBar } from "./_layout/second-sidebar";
import { ResponsiveMenuAtom } from "./_layout/header";
import { AccountPage } from "./account/profil";
import { AccountClientsPage } from "./account/clients";
import { SecurityPage } from "./account/security";
import { DashboardHomePage } from "./modules/dashboard/home";
import { InvoicesPage } from "./modules/invoices";
import { NoClientView } from "./no-client";
import { CompanyPage } from "./settings/company";
import { CompanyPlanPage } from "./settings/plan";
import { PreferencesPage } from "./settings/preferences";
import { CompanyUsersPage } from "./settings/users";
import { SideBar } from "./_layout/sidebar";
import { useWebsockets } from "@features/auth/state/use-sockets";

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

        <Route
          path={ROUTES.Settings}
          element={<Navigate to={getRoute(ROUTES.SettingsPreferences)} />}
        />
        <Route
          path={ROUTES.SettingsPreferences}
          element={<PreferencesPage />}
        />
        <Route path={ROUTES.SettingsCompany} element={<CompanyPage />} />
        <Route path={ROUTES.SettingsUsers} element={<CompanyUsersPage />} />
        <Route path={ROUTES.SettingsBilling} element={<CompanyPlanPage />} />

        <Route path={ROUTES.Home} element={<DashboardHomePage />} />
        <Route path={ROUTES.Invoices} element={<InvoicesPage />} />
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
      <div className="sm:overflow-auto overflow-hidden relative flex w-full grow flex-row bg-slate-50 dark:bg-slate-990 h-screen intro-animated-root z-10">
        <SideBar />
        <div
          className={
            "z-0 transition-all grow flex flex-col border-l sm:ml-20 " +
            (menuOpen
              ? " bg-slate-900 overflow-hidden "
              : "bg-white dark:bg-slate-950 ")
          }
          style={{
            transform: menuOpen ? "translateX(80px)" : "translateX(0)",
          }}
        >
          <Header />
          <div
            className="grow flex min-h-0 "
            onClick={() => setMenuOpen(false)}
          >
            <SecondSideBar />
            <div
              className={
                "grow min-h-0 overflow-auto bg-wood-25 dark:bg-slate-950 transition-all " +
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
