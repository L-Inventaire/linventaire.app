import { useAuth } from "@features/auth/state/use-auth";
import { useClients } from "@features/clients/state/use-clients";
import { ROUTES } from "@features/routes";
import { Modals } from "@views/modals";
import { Outlet, Route, useNavigate } from "react-router-dom";
import { Header } from "./_layout/header";
import { ChaussurePage } from "./chaussures";
import { DemoPage } from "./demo";
import { NoClientView } from "./no-client";
import { TabPage } from "./tableau";
import { Confetti } from "@atoms/confetti";
import { useRecoilValue } from "recoil";
import { DidCreateCompanyOrSignupAtom } from "@features/clients/state/store";
import { AnimatedBackground } from "@components/animated-background";
import { SideBar } from "./_layout/sidebar";

export const BackOfficeRoutes = () => {
  return (
    <>
      <Route path={ROUTES.JoinCompany} element={<NoClientView />} />
      <Route element={<Layout />}>
        <Route path={ROUTES.Home} element={<DemoPage />} />
        <Route path={ROUTES.Tableau} element={<TabPage />} />
        <Route path={ROUTES.Chaussures} element={<ChaussurePage />} />
      </Route>
    </>
  );
};

export const Layout = () => {
  const { user, logout } = useAuth();
  const { clients, loading } = useClients();
  const afterSignupOrNewCompany = useRecoilValue(DidCreateCompanyOrSignupAtom);
  const navigate = useNavigate();

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
        <div className="grow flex-col bg-white dark:bg-slate-950 border-l border-slate-500 border-opacity-15">
          <Header />
          <div className="grow flex min-h-0">
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
