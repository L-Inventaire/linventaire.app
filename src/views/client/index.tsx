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
    <div className="flex w-full grow flex-col bg-slate-50 dark:bg-slate-900 h-full">
      {afterSignupOrNewCompany && <Confetti />}
      <Header />
      <div className="grow flex min-h-0">
        <div className="grow min-h-0 overflow-auto">
          <Outlet />
        </div>
      </div>
      <Modals />
    </div>
  );
};
