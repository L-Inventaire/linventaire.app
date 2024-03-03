import { Confetti } from "@atoms/confetti";
import { AnimatedBackground } from "@components/animated-background";
import { useAuth } from "@features/auth/state/use-auth";
import { DidCreateCompanyOrSignupAtom } from "@features/clients/state/store";
import { useClients } from "@features/clients/state/use-clients";
import { ROUTES, getRoute, useRoutes } from "@features/routes";
import { Modals } from "@views/modals";
import { Outlet, Route, useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { Header } from "./_layout/header";
import { SideBar } from "./_layout/sidebar";
import { AccountPage } from "./account";
import { AccountClientsPage } from "./account/clients";
import { SecurityPage } from "./account/security";
import { DashboardHomePage } from "./modules/dashboard/home";
import { InvoicesPage } from "./modules/invoices";
import { NoClientView } from "./no-client";
import { CompanyPage } from "./settings/company";
import { CompanyPlanPage } from "./settings/plan";
import { PreferencesPage } from "./settings/preferences";
import { CompanyUsersPage } from "./settings/users";
import { Menu } from "@atoms/dropdown";
import { SectionSmall } from "@atoms/text";

export const BackOfficeRoutes = () => {
  return (
    <>
      <Route path={ROUTES.JoinCompany} element={<NoClientView />} />
      <Route element={<Layout />}>
        <Route path={ROUTES.Account} element={<AccountPage />} />
        <Route path={ROUTES.AccountClients} element={<AccountClientsPage />} />
        <Route path={ROUTES.AccountSecurity} element={<SecurityPage />} />

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
      <div className="flex w-full grow flex-row bg-slate-50 dark:bg-slate-990 h-screen intro-animated-root z-10">
        <SideBar />
        <div className="grow flex flex-col bg-white dark:bg-slate-950 border-l border-slate-500 border-opacity-15 sm:ml-20">
          <Header />
          <div className="grow flex min-h-0">
            {true && (
              <div className="sm:block hidden border-r border-slate-500 border-opacity-15 w-64 shrink-0 p-2 bg-wood-25 bg-opacity-50">
                <Menu
                  menu={[
                    {
                      type: "label",
                      label: (
                        <SectionSmall className="p-2 -mb-1">
                          Paramètres
                        </SectionSmall>
                      ),
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
                      label: (
                        <SectionSmall className="p-2 -mb-1">
                          Abonnement
                        </SectionSmall>
                      ),
                    },
                    {
                      label: "Paiements et plans",
                      to: getRoute(ROUTES.SettingsBilling),
                    },
                  ]}
                />
              </div>
            )}
            <div className="grow min-h-0 overflow-auto">
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
